from typing import List, Optional

from pydantic import BaseModel, Field


class ClassBlock(BaseModel):
    name: str
    days: List[str] = Field(default_factory=list)
    start_time: str
    end_time: str
    location: Optional[str] = None


class Commute(BaseModel):
    mode: str = "walk"
    minutes: int = 0
    notes: Optional[str] = None


class MealPlan(BaseModel):
    dining_hall: Optional[str] = None
    preferred_times: List[str] = Field(default_factory=list)
    restrictions: List[str] = Field(default_factory=list)


class Club(BaseModel):
    name: str
    days: List[str] = Field(default_factory=list)
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class Workout(BaseModel):
    activity: str
    days: List[str] = Field(default_factory=list)
    duration_minutes: int = 45
    preferred_time: Optional[str] = None


class OtherConstraint(BaseModel):
    label: str
    days: List[str] = Field(default_factory=list)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None


class OptimizeRequest(BaseModel):
    classes: List[ClassBlock] = Field(default_factory=list)
    commute: Commute = Field(default_factory=Commute)
    meal_plan: MealPlan = Field(default_factory=MealPlan)
    clubs: List[Club] = Field(default_factory=list)
    workouts: List[Workout] = Field(default_factory=list)
    other_constraints: List[OtherConstraint] = Field(default_factory=list)


class ScheduleBlock(BaseModel):
    day: str
    start_time: str
    end_time: str
    title: str
    kind: str


class OptimizeResponse(BaseModel):
    note: str
    weekly_schedule: List[ScheduleBlock] = Field(default_factory=list)
