using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CspjMail.Api.Migrations
{
    /// <inheritdoc />
    public partial class SoftDeleteUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Utilisateurs",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Utilisateurs");
        }
    }
}
