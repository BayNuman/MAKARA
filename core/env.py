# core/env.py
import os
import sys

def refresh_path_env() -> None:
    """
    Dynamically loads the latest Windows PATH environment variables from the registry
    to pick up newly installed tools (like Deno or Node.js via winget) without requiring 
    a system or application restart.
    """
    if sys.platform != "win32":
        return

    try:
        import winreg
        paths = []
        
        # 1. Query Registry for User-level Environment PATH
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment", 0, winreg.KEY_READ) as key:
                val, _ = winreg.QueryValueEx(key, "Path")
                if val:
                    paths.extend(val.split(os.pathsep))
        except Exception:
            pass

        # 2. Query Registry for System-level (Machine) Environment PATH
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"System\CurrentControlSet\Control\Session Manager\Environment", 0, winreg.KEY_READ) as key:
                val, _ = winreg.QueryValueEx(key, "Path")
                if val:
                    paths.extend(val.split(os.pathsep))
        except Exception:
            pass

        # 3. Add explicit check for Winget Local Packages directory where Deno/Node.js is usually extracted
        winget_packages_dir = os.path.expandvars(r"%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages")
        if os.path.exists(winget_packages_dir):
            base_depth = winget_packages_dir.rstrip(os.path.sep).count(os.path.sep)
            for root, dirs, files in os.walk(winget_packages_dir):
                current_depth = root.rstrip(os.path.sep).count(os.path.sep) - base_depth
                if current_depth >= 3:
                    del dirs[:]  # Stop descending further
                if "deno.exe" in files or "node.exe" in files:
                    paths.append(root)

        # 4. Search for bundled ffmpeg/ffprobe binaries and add their folder to PATH
        try:
            app_dir = os.path.dirname(sys.executable)
            candidate_dirs = [
                app_dir,
                os.path.join(app_dir, "bin"),
                os.path.join(app_dir, "resources"),
                os.path.join(app_dir, "resources", "bin"),
                os.path.abspath(os.path.join(app_dir, "..")),
                os.path.abspath(os.path.join(app_dir, "..", "resources")),
                os.path.abspath(os.path.join(app_dir, "..", "bin")),
                os.path.abspath(os.path.join(app_dir, "_up_", "_up_", "bin")),
                os.path.abspath(os.path.join(".", "bin"))
            ]
            for cd in candidate_dirs:
                if os.path.exists(cd):
                    fft = os.path.join(cd, "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg")
                    if os.path.exists(fft):
                        paths.append(cd)

            # Deep walk fallback in app_dir for resources
            if os.path.exists(app_dir):
                for root, dirs, files in os.walk(app_dir):
                    if "ffmpeg.exe" in files or "ffmpeg" in files:
                        paths.append(root)
                        break
        except Exception:
            pass

        # 5. Filter empty/duplicate paths and update the active process environment
        seen = set()
        cleaned_paths = []
        
        # Prepend the current path elements to avoid losing any dynamic paths added at runtime
        current_env_paths = os.environ.get("PATH", "").split(os.pathsep)
        for p in current_env_paths + paths:
            p_clean = os.path.expandvars(p.strip())
            if p_clean and p_clean not in seen:
                seen.add(p_clean)
                cleaned_paths.append(p_clean)
                
        os.environ["PATH"] = os.pathsep.join(cleaned_paths)
    except Exception as e:
        print(f"Error refreshing PATH: {e}")
