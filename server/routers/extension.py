from fastapi import APIRouter, HTTPException, status, Request
from server.models import AddTaskRequest

router = APIRouter(
    prefix="/extension",
    tags=["extension"]
)

@router.get("/ping")
async def extension_ping():
    """Health check for Chrome/Edge Companion Extension."""
    return {"status": "ok", "message": "yt-dlp Downloader Pro Companion API Active"}

@router.post("/add", status_code=status.HTTP_201_CREATED)
async def add_from_extension(req: AddTaskRequest, request: Request):
    """Allows browser extension companions to enqueue download tasks directly."""
    controller = request.app.state.server.controller
    
    # 1. Duplicate check
    is_dup, title, fmt = controller.check_duplicate(req.url, req.settings or {})
    if is_dup:
        return {
            "success": False,
            "detail": f"Tekrar İndirme: '{title}' ({fmt}) zaten kuyrukta mevcut.",
            "added_count": 0
        }
        
    # 2. Add to queue
    success, err_msg, added_count = controller.validate_and_add_tasks(
        url=req.url,
        item_cfg=req.settings or {},
        multi_clips=[],
        lang=controller.state.current_lang
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )
        
    return {
        "success": True,
        "detail": f"Successfully added {added_count} task(s) to the queue.",
        "added_count": added_count
    }
