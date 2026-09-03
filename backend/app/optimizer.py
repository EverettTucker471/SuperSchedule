from .models import OptimizeRequest, OptimizeResponse, ScheduleBlock


def optimize_schedule(request: OptimizeRequest) -> OptimizeResponse:
    """Return a placeholder weekly schedule. Algorithm is not implemented yet."""
    blocks = []
    for cls in request.classes:
        for day in cls.days or ["Monday"]:
            blocks.append(
                ScheduleBlock(
                    day=day,
                    start_time=cls.start_time,
                    end_time=cls.end_time,
                    title=cls.name,
                    kind="class",
                )
            )
    if not blocks:
        blocks.append(
            ScheduleBlock(
                day="Monday",
                start_time="09:00",
                end_time="10:00",
                title="Placeholder block",
                kind="stub",
            )
        )
    return OptimizeResponse(
        note="Stub schedule only. The SuperSchedule optimizer is not implemented yet.",
        weekly_schedule=blocks,
    )
