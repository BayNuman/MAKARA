from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional
from server.models import AddTaskRequest
from core.history import get_app_data_dir

router = APIRouter(
    prefix="/extension",
    tags=["extension"]
)

class CookieSyncRequest(BaseModel):
    cookies_txt: str

@router.get("/ping")
async def extension_ping():
    """Health check for Chrome/Edge Companion Extension."""
    return {"status": "ok", "message": "Makara Pro Companion API Active"}

def sanitize_netscape_cookies(cookies_txt: str) -> str:
    """Cleans and enforces RFC 6265 Netscape cookie formatting rules for http.cookiejar compatibility."""
    lines = cookies_txt.splitlines()
    clean_lines = [
        "# Netscape HTTP Cookie File",
        "# http://curl.haxx.se/rfc/cookie_spec.html",
        "# Sanitized by Makara Pro",
        ""
    ]
    for line in lines:
        line_str = line.strip()
        if not line_str or line_str.startswith("#"):
            continue
        parts = line_str.split("\t")
        if len(parts) < 7:
            continue
        domain, include_sub, path, secure, expires, name, value = parts[:7]
        
        is_host_only = name.startswith("__Host-")
        if is_host_only:
            if domain.startswith("."):
                domain = domain[1:]
            include_sub = "FALSE"
        else:
            if domain.startswith("."):
                include_sub = "TRUE"
            else:
                include_sub = "FALSE"
                
        clean_lines.append(f"{domain}\t{include_sub}\t{path}\t{secure}\t{expires}\t{name}\t{value}")
    return "\n".join(clean_lines) + "\n"

@router.post("/sync-cookies")
async def sync_cookies_from_extension(payload: CookieSyncRequest, request: Request):
    """Receives Netscape cookies.txt string exported by browser extension and saves to app_data/user_cookies.txt."""
    content = payload.cookies_txt.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Empty cookies content")
        
    try:
        clean_content = sanitize_netscape_cookies(content)
        app_dir = get_app_data_dir()
        cookie_file = app_dir / "user_cookies.txt"
        cookie_file.write_text(clean_content, encoding="utf-8")
        
        # Also update global preferences if needed
        controller = request.app.state.server.controller
        controller.state.preferences.browser_cookies = str(cookie_file)
        from core.app_state import save_app_preferences
        save_app_preferences(controller.state.preferences)
        
        return {
            "success": True,
            "detail": f"Çerezler başarıyla senkronize edildi ({len(content.splitlines())} satır)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Çerez senkronizasyonu başarısız: {str(e)}")

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
