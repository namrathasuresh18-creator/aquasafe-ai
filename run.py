import os
import sys
import subprocess
import webbrowser
import time

def install_dependencies():
    print("[AquaSafe AI Launcher] Checking backend dependencies...")
    try:
        import fastapi
        import uvicorn
        print("[AquaSafe AI Launcher] Dependencies are already installed.")
    except ImportError:
        print("[AquaSafe AI Launcher] Installing required libraries (fastapi, uvicorn)...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn"])
            print("[AquaSafe AI Launcher] Installation successful!")
        except Exception as e:
            print(f"[AquaSafe AI Launcher] Error installing packages: {e}")
            print("[AquaSafe AI Launcher] Please run: pip install fastapi uvicorn")
            sys.exit(1)

def launch_server():
    print("[AquaSafe AI Launcher] Launching FastAPI Web Server on http://localhost:8000...")
    
    # Set CWD to the project root directory where this script is located
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)
    
    # Launch browser after a short delay to allow server startup
    try:
        # We start uvicorn as a subprocess or directly import and run it
        # Subprocess is preferred because it handles keyboard interrupt gracefully and separates stdout
        cmd = [sys.executable, "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", os.environ.get("PORT", "8000")]
        
        print("[AquaSafe AI Launcher] Starting server subprocess...")
        # Start browser in a background thread or delayed launch
        print("[AquaSafe AI Launcher] Opening dashboard at http://localhost:8000 in your browser...")
        # Simple delay before opening browser
        
        server_process = subprocess.Popen(cmd)
        
        # Wait 2 seconds for server to initialize
        time.sleep(2.5)
        webbrowser.open("http://localhost:8000")
        
        # Keep waiting on the process
        server_process.wait()
    except KeyboardInterrupt:
        print("\n[AquaSafe AI Launcher] Shutting down server. Goodbye!")
    except Exception as e:
        print(f"[AquaSafe AI Launcher] Server crashed or failed to start: {e}")

if __name__ == "__main__":
    print("====================================================")
    print("           AquaSafe AI Environmental Platform       ")
    print("====================================================")
    install_dependencies()
    launch_server()
