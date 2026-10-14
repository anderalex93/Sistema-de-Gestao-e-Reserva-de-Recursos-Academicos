from app.models.campus_settings import SETTINGS_ID, CampusSettings
from app.repositories.base import BaseRepository


class CampusSettingsRepository(BaseRepository[CampusSettings]):
    model = CampusSettings

    def current(self) -> CampusSettings | None:
        """A configuração salva pela administração, ou `None` enquanto valem as do ambiente."""
        return self.get(SETTINGS_ID)

    def refresh(self, entity: CampusSettings) -> None:
        """Relê a linha depois do commit, para devolver a data de atualização do banco."""
        self._session.refresh(entity)
