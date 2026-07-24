//! Add user theme appearance settings.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(User::Table)
                    .add_column(ColumnDef::new(User::ThemeAppearance).text().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Err(DbErr::Custom(
            "Theme appearance migration cannot be safely rolled back; restore from backup if needed."
                .to_string(),
        ))
    }
}

#[derive(DeriveIden)]
enum User {
    Table,
    ThemeAppearance,
}
