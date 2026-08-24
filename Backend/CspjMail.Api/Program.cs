using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using CspjMail.Api.Models;
using CspjMail.Api.Configuration;
using CspjMail.Api.Services;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);

// ── Upload Size Limits ────────────────────────────────────────────────────────
// Prevent attackers from uploading multi-gigabyte files.
// Enforced at both the Kestrel transport layer and the ASP.NET form reader.
const long MaxUploadBytes = 10 * 1024 * 1024; // 10 MB

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = MaxUploadBytes;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MaxUploadBytes;
    options.ValueLengthLimit = int.MaxValue; // allow long HTML bodies from Tiptap
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── In-Memory Cache (used for TOTP replay prevention and reset-token jti blacklist) ──
builder.Services.AddMemoryCache();

// ── Rate Limiting ─────────────────────────────────────────────────────────────────
// "totp-ops" — fixed window: max 5 requests per 60 s per client IP.
// Applied to all authentication endpoints that accept TOTP codes or credentials
// to block brute-force and credential-stuffing attacks.
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter(policyName: "totp-ops", limiterOptions =>
    {
        limiterOptions.Window           = TimeSpan.FromSeconds(60);
        limiterOptions.PermitLimit      = 5;
        limiterOptions.QueueLimit       = 0;                 // reject immediately — no queueing
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // Return HTTP 429 with a Retry-After header so clients know when to retry.
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode  = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"error\":\"Too many requests. Please wait 60 seconds before retrying.\"}",
            cancellationToken);
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000") // Default Vite and Create React App ports
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register SQL Server Database Context
builder.Services.AddDbContext<CspjMiniMailDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

// Configure SmtpSettings
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));
builder.Services.AddScoped<IEmailService, MailKitEmailService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("cspj_auth_token"))
            {
                context.Token = context.Request.Cookies["cspj_auth_token"];
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// ── Security Response Headers ─────────────────────────────────────────────────
// Applied to every response before any other middleware. These are defence-in-depth
// headers that harden the browser security posture even when application-level
// controls (CSP, RBAC) are the primary line of defence.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Swagger UI exposed only in Development to prevent API schema disclosure in production.
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Serve files from wwwroot/ (e.g. /uploads/*) BEFORE routing/auth so static
// requests bypass the API middleware stack entirely.
// ServeUnknownFileTypes = false ensures only files with known/safe MIME types are served.
var provider = new FileExtensionContentTypeProvider();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider,
    ServeUnknownFileTypes = false,
    OnPrepareResponse = ctx =>
    {
        // Prevent browsers from caching sensitive attachments across sessions
        ctx.Context.Response.Headers["Cache-Control"] = "no-store, no-cache";
        ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        ctx.Context.Response.Headers["Content-Disposition"] = "attachment";
    }
});

// Rate limiter must come before CORS so that rejected requests never reach
// downstream middleware, and before authentication to prevent credential stuffing.
app.UseRateLimiter();

app.UseCors("AllowFrontend");

// Authentication MUST come before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply any pending database migrations automatically on startup
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CspjMiniMailDbContext>();
    db.Database.Migrate();
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "An error occurred while applying database migrations on startup.");
}

app.Run();