# core/scheduler.py
"""
yt-dlp Downloader Pro - Event-Driven Task Scheduler Engine
Provides zero-CPU overhead background scheduling using threading.Condition and timestamp evaluation.
"""

import time
import threading
import datetime
import logging
from typing import Callable, Optional, List

class TaskScheduler:
    """Manages scheduled download tasks with zero-CPU condition waiting."""

    def __init__(self, dispatch_callback: Optional[Callable[[str], None]] = None):
        self.dispatch_callback = dispatch_callback
        self._scheduled_tasks: List[dict] = []  # [{task_id, target_timestamp, ...}]
        self._lock = threading.Lock()
        self._cond = threading.Condition(self._lock)
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """Starts the scheduler background daemon thread."""
        with self._lock:
            if self._running:
                return
            self._running = True
            self._thread = threading.Thread(target=self._worker_loop, daemon=True, name="task-scheduler")
            self._thread.start()
            logging.info("[Scheduler] Event-driven task scheduler engine started.")

    def stop(self):
        """Stops the scheduler daemon thread gracefully."""
        with self._lock:
            self._running = False
            self._cond.notify_all()

    def schedule_task(self, task_id: str, target_time_str: str) -> Optional[float]:
        """
        Schedules a task for execution at target_time_str (e.g. '03:00' or ISO timestamp).
        Returns target epoch timestamp if successfully scheduled, None otherwise.
        """
        target_ts = self._parse_target_time(target_time_str)
        if not target_ts:
            return None

        with self._lock:
            # Remove any existing schedule for this task ID
            self._scheduled_tasks = [t for t in self._scheduled_tasks if t["task_id"] != task_id]
            self._scheduled_tasks.append({
                "task_id": task_id,
                "target_timestamp": target_ts,
                "time_str": target_time_str
            })
            # Sort scheduled tasks by earliest target timestamp
            self._scheduled_tasks.sort(key=lambda x: x["target_timestamp"])
            # Wake worker loop to re-evaluate nearest wait timeout
            self._cond.notify_all()

        logging.info(f"[Scheduler] Task '{task_id}' scheduled for target time: {target_time_str} (Epoch: {target_ts})")
        return target_ts

    def cancel_schedule(self, task_id: str):
        """Cancels any pending schedule for a task ID."""
        with self._lock:
            self._scheduled_tasks = [t for t in self._scheduled_tasks if t["task_id"] != task_id]
            self._cond.notify_all()

    def get_scheduled_tasks(self) -> List[dict]:
        """Returns copy of active scheduled tasks."""
        with self._lock:
            return list(self._scheduled_tasks)

    def _worker_loop(self):
        while self._running:
            with self._lock:
                if not self._running:
                    break

                now = time.time()
                ready_tasks = []
                remaining_tasks = []

                for item in self._scheduled_tasks:
                    if item["target_timestamp"] <= now:
                        ready_tasks.append(item["task_id"])
                    else:
                        remaining_tasks.append(item)

                self._scheduled_tasks = remaining_tasks

                # Dispatch ready tasks
                for task_id in ready_tasks:
                    logging.info(f"[Scheduler] Firing scheduled task '{task_id}'!")
                    if self.dispatch_callback:
                        try:
                            self.dispatch_callback(task_id)
                        except Exception as e:
                            logging.error(f"[Scheduler] Error dispatching scheduled task '{task_id}': {e}")

                # Determine next wait duration
                if self._scheduled_tasks:
                    next_target = self._scheduled_tasks[0]["target_timestamp"]
                    wait_seconds = max(0.1, next_target - time.time())
                else:
                    wait_seconds = None  # Wait indefinitely until notify() is called on new schedule

                if self._running:
                    if wait_seconds is not None:
                        self._cond.wait(timeout=wait_seconds)
                    else:
                        self._cond.wait()

    def _parse_target_time(self, time_str: str) -> Optional[float]:
        """Parses ISO timestamp or 'HH:MM' time string into future epoch seconds."""
        if not time_str:
            return None

        now = datetime.datetime.now()

        # 1. Try HH:MM format
        try:
            parts = time_str.strip().split(":")
            if len(parts) >= 2:
                hour = int(parts[0])
                minute = int(parts[1])
                target_dt = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if target_dt <= now:
                    # If target time is earlier today, schedule for tomorrow
                    target_dt += datetime.timedelta(days=1)
                return target_dt.timestamp()
        except Exception:
            pass

        # 2. Try ISO format
        try:
            target_dt = datetime.datetime.fromisoformat(time_str.strip())
            return target_dt.timestamp()
        except Exception:
            pass

        return None

# Global scheduler instance
global_scheduler = TaskScheduler()
