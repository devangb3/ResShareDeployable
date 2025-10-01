#!/bin/bash
set -e

# Log file for debugging
LOG_FILE="/app/startup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=========================================="
echo "Starting ResShare Backend..."
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"
echo "Date: $(date)"
echo "=========================================="

# Check if IPFS is installed
echo "Checking IPFS installation..."
which ipfs || echo "ERROR: IPFS not found in PATH"
ipfs version || echo "ERROR: Cannot run ipfs version"

# Initialize IPFS if not already initialized
if [ ! -f /root/.ipfs/config ]; then
    echo "Initializing IPFS..."
    ipfs init
else
    echo "IPFS already initialized"
fi

# Initialize IPFS Cluster if not already initialized
if [ ! -f /root/.ipfs-cluster/service.json ]; then
    echo "Initializing IPFS Cluster..."
    ipfs-cluster-service init
else
    echo "IPFS Cluster already initialized"
fi

# Start IPFS daemon in background with detailed logging
echo "Starting IPFS daemon..."
echo "IPFS will log to /app/ipfs.log"
ipfs daemon > /app/ipfs.log 2>&1 &
IPFS_PID=$!
echo "IPFS daemon started with PID: $IPFS_PID"

# Wait for IPFS to be ready with better error handling
echo "Waiting for IPFS to be ready..."
IPFS_READY=false
for i in {1..30}; do
    if ipfs id > /dev/null 2>&1; then
        echo "✓ IPFS is ready!"
        IPFS_READY=true
        ipfs id
        break
    fi
    echo "Waiting for IPFS... ($i/30)"
    
    # Check if IPFS process is still running
    if ! kill -0 $IPFS_PID 2>/dev/null; then
        echo "ERROR: IPFS daemon process died! Check /app/ipfs.log"
        tail -50 /app/ipfs.log
        exit 1
    fi
    
    sleep 2
done

if [ "$IPFS_READY" = false ]; then
    echo "ERROR: IPFS failed to start after 60 seconds"
    echo "Last 50 lines of IPFS log:"
    tail -50 /app/ipfs.log
    exit 1
fi

# Start IPFS cluster service in background with logging
echo "Starting IPFS Cluster service..."
echo "IPFS Cluster will log to /app/ipfs-cluster.log"
ipfs-cluster-service daemon > /app/ipfs-cluster.log 2>&1 &
CLUSTER_PID=$!
echo "IPFS Cluster started with PID: $CLUSTER_PID"

# Wait for cluster to be ready
echo "Waiting for IPFS Cluster to be ready..."
sleep 5

# Check cluster status
echo "Checking IPFS Cluster status..."
tail -20 /app/ipfs-cluster.log

# Activate conda environment and start Flask application
echo "=========================================="
echo "Starting Flask application..."
echo "Python version:"
cd /app
source /opt/conda/etc/profile.d/conda.sh
conda activate reschat_venv
python --version
echo "Flask will log to stdout/stderr"
echo "=========================================="

# Keep Flask logs visible
exec python app.py

