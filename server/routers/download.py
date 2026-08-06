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

    path_str = payload.get("path")
    if not path_str:
        raise HTTPException(status_code=400, detail="Path is required")
        
    p = Path(path_str).expanduser()
    if p.is_file():
        folder = p.parent
    else:
        folder = p
        
    if not folder.exists():
        folder = Path.home() / "Desktop"
        
    try:
        if os.name == "nt":
            if p.is_file() and p.exists():
                subprocess.Popen(f'explorer /select,"{p}"', shell=True)
            else:
                os.startfile(str(folder))
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(folder)])
        else:
            subprocess.Popen(["xdg-open", str(folder)])
        return {"success": True, "detail": "Opened folder location."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
