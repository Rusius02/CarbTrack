from dataclasses import dataclass
import math


ACTIVITY_CATEGORIES = {
    "Transport",
    "Énergie",
    "Alimentation",
    "Achats",
    "Numérique",
    "Autre",
}
EMISSION_SCOPES = {"Scope 1", "Scope 2", "Scope 3"}


class ValidationError(ValueError):
    """Raised when persisted or received workspace data violates domain rules."""


@dataclass(frozen=True)
class Activity:
    id: str
    name: str
    category: str
    quantity: float
    unit: str
    factor: float
    year: int
    scope: str = "Scope 3"

    def __post_init__(self):
        if not isinstance(self.id, str) or not self.id.strip():
            raise ValidationError("L’identifiant d’activité est obligatoire.")
        if not isinstance(self.name, str) or not self.name.strip() or len(self.name.strip()) > 80:
            raise ValidationError("La description doit contenir entre 1 et 80 caractères.")
        if not isinstance(self.category, str) or self.category not in ACTIVITY_CATEGORIES:
            raise ValidationError("La catégorie de l’activité est invalide.")
        if not _is_finite_number(self.quantity) or self.quantity <= 0:
            raise ValidationError("La quantité doit être un nombre positif.")
        if not isinstance(self.unit, str) or not self.unit.strip() or len(self.unit.strip()) > 20:
            raise ValidationError("L’unité doit contenir entre 1 et 20 caractères.")
        if not _is_finite_number(self.factor) or self.factor < 0:
            raise ValidationError("Le facteur d’émission doit être positif ou nul.")
        if not math.isfinite(self.quantity * self.factor):
            raise ValidationError("Le résultat du calcul des émissions dépasse la plage numérique.")
        if not isinstance(self.year, int) or isinstance(self.year, bool) or self.year < 1900:
            raise ValidationError("L’année de l’activité est invalide.")
        if not isinstance(self.scope, str) or self.scope not in EMISSION_SCOPES:
            raise ValidationError("Le périmètre d’émissions est invalide.")

        object.__setattr__(self, "id", self.id.strip())
        object.__setattr__(self, "name", self.name.strip())
        object.__setattr__(self, "unit", self.unit.strip())

    @property
    def emissions(self):
        return self.quantity * self.factor

    @classmethod
    def from_dict(cls, data):
        if not isinstance(data, dict):
            raise ValidationError("Une activité doit être un objet.")
        required_fields = {"id", "name", "category", "quantity", "unit", "factor", "year"}
        missing_fields = required_fields - data.keys()
        if missing_fields:
            raise ValidationError(f"Champs manquants dans une activité : {', '.join(sorted(missing_fields))}.")
        try:
            return cls(
                id=data["id"],
                name=data["name"],
                category=data["category"],
                quantity=data["quantity"],
                unit=data["unit"],
                factor=data["factor"],
                year=data["year"],
                scope=data.get("scope", "Scope 3"),
            )
        except (TypeError, OverflowError) as error:
            raise ValidationError("Les données numériques de l’activité sont invalides.") from error

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "unit": self.unit,
            "factor": self.factor,
            "year": self.year,
            "scope": self.scope,
        }


@dataclass(frozen=True)
class Workspace:
    profile: str
    goal: float
    activities: tuple[Activity, ...]

    def __post_init__(self):
        if not isinstance(self.profile, str) or self.profile not in {"personal", "organization"}:
            raise ValidationError("Le profil doit être personal ou organization.")
        if not _is_finite_number(self.goal) or self.goal <= 0:
            raise ValidationError("Le repère annuel doit être un nombre positif.")
        if not isinstance(self.activities, (list, tuple)):
            raise ValidationError("Les activités doivent être une liste.")
        activities = tuple(
            activity if isinstance(activity, Activity) else Activity.from_dict(activity)
            for activity in self.activities
        )
        identifiers = [activity.id for activity in activities]
        if len(identifiers) != len(set(identifiers)):
            raise ValidationError("Les identifiants d’activités doivent être uniques.")
        object.__setattr__(self, "activities", activities)

    @classmethod
    def from_dict(cls, data):
        if not isinstance(data, dict):
            raise ValidationError("Le workspace doit être un objet JSON.")
        activities = data.get("activities", [])
        if not isinstance(activities, list):
            raise ValidationError("Les activités doivent être une liste.")
        return cls(
            profile=data.get("profile", "personal"),
            goal=data.get("goal", 2000),
            activities=tuple(Activity.from_dict(activity) for activity in activities),
        )

    def to_dict(self):
        return {
            "profile": self.profile,
            "goal": self.goal,
            "activities": [activity.to_dict() for activity in self.activities],
        }


def _is_finite_number(value):
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False
