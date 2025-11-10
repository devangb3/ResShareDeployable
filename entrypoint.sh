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
    # Configure IPFS to listen on all interfaces
    ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
    ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080
    ipfs config Addresses.Swarm --json '["/ip4/0.0.0.0/tcp/4001", "/ip6/::/tcp/4001", "/ip4/0.0.0.0/udp/4001/quic", "/ip6/::/udp/4001/quic"]'
else
    echo "IPFS already initialized"
    # Ensure IPFS is configured to listen on all interfaces
    ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
    ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080
fi

# Initialize IPFS Cluster if not already initialized
if [ ! -f /root/.ipfs-cluster/service.json ]; then
    echo "Initializing IPFS Cluster..."
    ipfs-cluster-service init --consensus crdt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to initialize IPFS Cluster"
        exit 1
    fi
else
    echo "IPFS Cluster already initialized"
fi

# Configure cluster to listen on all interfaces and use CRDT consensus
echo "Configuring IPFS Cluster..."
ipfs-cluster-service config api.restapi.http_listen_multiaddress /ip4/0.0.0.0/tcp/9094
ipfs-cluster-service config cluster.listen_multiaddress /ip4/0.0.0.0/tcp/9096

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

# Set up cleanup trap
cleanup() {
    echo "Shutting down services..."
    kill $CLUSTER_PID 2>/dev/null
    kill $IPFS_PID 2>/dev/null
    exit 0
}
trap cleanup SIGTERM SIGINT

# Wait for cluster to be ready
echo "Waiting for IPFS Cluster to be ready..."
CLUSTER_READY=false
for i in {1..30}; do
    # Check if cluster process died
    if ! kill -0 $CLUSTER_PID 2>/dev/null; then
        echo "=========================================="
        echo "ERROR: IPFS Cluster process died!"
        echo "=========================================="
        echo "Last 100 lines of IPFS Cluster log:"
        tail -100 /app/ipfs-cluster.log
        echo "=========================================="
        echo "DEPLOYMENT FAILED: IPFS Cluster is required"
        echo "Please check the logs above for details"
        echo "=========================================="
        exit 1
    fi

    # Check if cluster is responding
    if curl -s http://localhost:9094/api/v0/id > /dev/null 2>&1; then
        echo "✓ IPFS Cluster is ready!"
        CLUSTER_READY=true
        break
    fi

    echo "Waiting for IPFS Cluster... ($i/30)"
    sleep 2
done

if [ "$CLUSTER_READY" = false ]; then
    echo "=========================================="
    echo "ERROR: IPFS Cluster failed to start after 60 seconds"
    echo "=========================================="
    echo "Last 100 lines of IPFS Cluster log:"
    tail -100 /app/ipfs-cluster.log
    echo "=========================================="
    echo "DEPLOYMENT FAILED: IPFS Cluster is required"
    echo "Common issues:"
    echo "  1. Port 9094 already in use"
    echo "  2. Insufficient memory (need at least 8GB)"
    echo "  3. Corrupted cluster data (try: docker compose down -v)"
    echo "=========================================="
    exit 1
fi

# Check cluster status
echo "Checking IPFS Cluster status..."
curl -s http://localhost:9094/api/v0/id | head -20

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

# Start Flask in foreground
exec python app.py

