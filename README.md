# ResShare - Decentralized File Sharing Application

ResShare is a decentralized file sharing application that allows users to securely store, share, and manage their files using Resilient DB technology. The application provides a user-friendly interface for file management with features like folder creation, file sharing, and secure authentication.

## Features

- User Authentication (Sign up, Login, Logout)
- File Upload and Download
- Folder Creation and Management
- File Sharing between Users
- Secure File Storage using IPFS
- User Account Management

## Tech Stack

- **Frontend**: React.js
- **Backend**: Python Flask
- **Storage**:  ResilientDB for Metadata storage and IPFS (File Storage)
- **Authentication**: Session-based authentication

## Prerequisites

- Python 3.x
- Node.js and npm
- IPFS daemon running locally

## Installation

1. Clone the repository:
```bash
git clone https://github.com/NoBugInMyCode/ResShareDeployable.git
cd ResShareDeployable
```

2. Install backend dependencies:
```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Running the Application

1. Start the IPFS daemon (To install IPFS Cluster Service, please refer to [Link](https://ipfscluster.io/download/)):
```bash
ipfs daemon
```

2. Start the backend server (from the root directory):
```bash
python app.py
```

3. Start the frontend development server (from the frontend directory):
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. Create a new account using the sign-up feature
2. Log in to your account
3. Create folders to organize your files
4. Upload files to your folders
5. Share files with other users
6. Download shared files from other users

## Security Features

- Password hashing using SHA-256
- Session-based authentication
- File size limits (500MB per file)
- Secure file storage using IPFS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
