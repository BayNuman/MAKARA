import threading
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from typing import Dict, Any

from server.security import verify_token
from server.ws.manager import WebSocketEventEmitter
from core.downloader import run_queue_executor

router = APIRouter(
    prefix="/download",
    tags=["download"],
    dependencies=[Depends(verify_token)]
)

@router.post("/start")
async def start_downloads(request: Request) -> Dict[str, Any]:
    """Starts processing all pending downloads in the queue concurrently using background workers."""
    server = request.app.state.server
    controller = server.controller
    
    # Verify not already running
    if controller.state.is_executor_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Download executor is already running."
        )
        
    # Clear the cancel event and trigger execution thread
    server.cancel_event.clear()
    emitter = WebSocketEventEmitter(server.ws_manager, server.loop)
    
    threading.Thread(
        target=run_queue_executor,
        args=(controller.state, emitter, server.cancel_event),
        daemon=True,
        name="api-queue-executor"
    ).start()
    
    return {"success": True, "detail": "Download queue execution started."}

@router.post("/cancel")
async def cancel_downloads(request: Request) -> Dict[str, Any]:
    """Signals all running downloads to stop and kills their subprocesses immediately."""
    server = request.app.state.server
    
    # Trigger cancellation flags on all worker processes
    server.cancel_event.set()
    server.controller.cancel_all_tasks()
    
    return {"success": True, "detail": "All downloads cancelled successfully."}

@router.post("/open-folder")
async def open_file_folder(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Opens the directory or selects the target file in OS Explorer."""
    import os
    import sys
    import subprocess
    from pathlib import Path

    path_str = str(payload.get("path", "")).strip()
    if not path_str:
        raise HTTPException(status_code=400, detail="Path is required")
        
    p = Path(path_str).expanduser()
    
    try:
        if os.name == "nt":
            norm_path = os.path.normpath(str(p))
            if os.path.isfile(norm_path):
                # File exists -> open explorer and highlight the exact file!
                subprocess.Popen(f'explorer /select,"{norm_path}"', shell=True)
            elif os.path.exists(norm_path):
                # Path is a directory -> open folder directly
                os.startfile(norm_path)
            else:
                # File was moved or doesn't exist directly, check parent folder
                parent = os.path.dirname(norm_path)
                if os.path.exists(parent):
                    os.startfile(parent)
                else:
                    os.startfile(str(Path.home() / "Desktop"))
        elif sys.platform == "darwin":
            folder = str(p.parent) if p.is_file() else str(p)
            subprocess.Popen(["open", folder])
        else:
            folder = str(p.parent) if p.is_file() else str(p)
            subprocess.Popen(["xdg-open", folder])
        return {"success": True, "detail": "Opened folder location."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
