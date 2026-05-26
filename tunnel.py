import subprocess
import re
import time
import os
import sys

def start_server():
    print("[Tunnel] Starting FastAPI backend on port 8000...")
    cmd = [sys.executable, "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8000"]
    server_proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return server_proc

def start_tunnel():
    print("[Tunnel] Establishing public SSH tunnel via localhost.run...")
    # Using localhost.run
    tunnel_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", "-R", "80:127.0.0.1:8000", "nokey@localhost.run"]
    tunnel_proc = subprocess.Popen(tunnel_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, encoding='utf-8', errors='ignore')
    
    public_url = None
    start_time = time.time()
    
    # Read output to capture the link
    while time.time() - start_time < 12:
        line = tunnel_proc.stdout.readline()
        if not line:
            break
        try:
            print(f"[SSH Out] {line.strip()}")
        except:
            pass
        # Check for URL
        match = re.search(r'https?://[a-zA-Z0-9.-]+\.lhrtunnel\.link', line)
        if match:
            public_url = match.group(0)
            break
        match_generic = re.search(r'https?://[a-zA-Z0-9.-]+\.lhr\.life', line)
        if match_generic:
            public_url = match_generic.group(0)
            break
            
    if not public_url:
        print("[Tunnel] localhost.run failed or timed out. Trying fallback: a.pinggy.io...")
        try:
            tunnel_proc.terminate()
        except:
            pass
        # Try Pinggy
        tunnel_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", "-R", "80:127.0.0.1:8000", "a.pinggy.io"]
        tunnel_proc = subprocess.Popen(tunnel_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, encoding='utf-8', errors='ignore')
        
        start_time = time.time()
        while time.time() - start_time < 12:
            line = tunnel_proc.stdout.readline()
            if not line:
                break
            try:
                print(f"[SSH Out] {line.strip()}")
            except:
                pass
            match = re.search(r'https?://[a-zA-Z0-9.-]+\.pinggy\.link', line)
            if match:
                public_url = match.group(0)
                break
                
    if public_url:
        print("\n====================================================")
        print("PUBLIC ACCESS LINK GENERATED successfully!")
        print(f"Link: {public_url}")
        print("====================================================\n")
        
        # Save to file so parent agent can read it
        with open("public_link.txt", "w", encoding='utf-8') as f:
            f.write(public_url)
    else:
        print("[Tunnel] Failed to generate a public link. Please verify internet connection and OpenSSH.")
        
    return tunnel_proc

if __name__ == "__main__":
    # Ensure dependencies are installed first
    try:
        import fastapi
        import uvicorn
    except ImportError:
        print("[Tunnel] Standard server libraries missing. Installing uvicorn & fastapi...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn"])
        
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sp = start_server()
    time.sleep(2.5) # Give server time to bind port
    tp = start_tunnel()
    
    try:
        # Keep alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[Tunnel] Stopping server and tunnel...")
        sp.terminate()
        tp.terminate()
