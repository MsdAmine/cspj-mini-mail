using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CspjMail.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTailleFichierToPiecesJointes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TailleFichier",
                table: "PiecesJointes",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Empty to allow rollback since column does not exist
        }
    }
}
