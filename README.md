# ResShare - Decentralized File Sharing Application with AI Chatbot

ResShare is a decentralized file sharing application that allows users to securely store, share, and manage their files using Resilient DB technology. The application now features an **AI-powered chatbot** that can answer questions about your uploaded documents using Retrieval-Augmented Generation (RAG).

## Features

### Core Features
- User Authentication (Sign up, Login, Logout)
- File Upload and Download
- Folder Creation and Management
- File Sharing between Users
- Secure File Storage using IPFS
- User Account Management

### AI Document Assistant
- **Intelligent Document Q&A**: Ask questions about your uploaded files
- **Multi-format Support**: Works with PDF, DOCX, and TXT files
- **Semantic Search**: Finds relevant information across all your documents
- **Privacy-First**: Your data stays isolated and secure
- **Source Attribution**: See which documents were used to answer your questions

## Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Python Flask
- **Storage**: ResilientDB for Metadata storage and IPFS for File Storage
- **Authentication**: Session-based authentication
- **AI/ML**: 
  - Sentence Transformers for embeddings
  - FAISS for vector search
  - Gemini GPT (optional) or local models for response generation
  - LangChain for text processing

## Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- IPFS daemon running locally
- (Optional) Gemini API key for enhanced AI responses

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/NoBugInMyCode/ResShareDeployable.git
cd ResShareDeployable
```

2. **Install backend dependencies:**
```bash
pip install -r requirements.txt
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

4. **Set up AI features (Optional but recommended):**
```bash
# For enhanced AI responses, set your Gemini API key
export GOOGLE_API_KEY="your-gemini-api-key-here"
```

## Running the Application

1. **Start the IPFS daemon:**
```bash
ipfs daemon
```
*To install IPFS Cluster Service, please refer to [this link](https://ipfscluster.io/download/)*

2. **Start the backend server:**
```bash
python app.py
```

3. **Start the frontend development server:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Using the AI Chatbot

### Getting Started with AI
1. **Upload Documents**: Upload PDF, DOCX, or TXT files through the normal file upload process
2. **Navigate to AI Chat**: Click the "AI Chat" button in the navigation bar
3. **Ask Questions**: Type questions about your documents and get intelligent responses

### Example Queries
- "What are the main findings in my research paper?"
- "Summarize the key points from my meeting notes"
- "What does my contract say about payment terms?"
- "Find information about project deadlines"

### Supported File Types for AI
- **PDF**: Research papers, reports, contracts
- **DOCX**: Word documents, meeting notes, proposals  
- **TXT**: Plain text files, code documentation, notes

### AI Features
- **Smart Chunking**: Documents are intelligently split into semantic chunks
- **Vector Search**: Uses advanced embeddings to find relevant content
- **Source Attribution**: Shows which files and sections were used for answers
- **Privacy Preserved**: Each user's AI data is completely isolated

## Configuration

### Basic Configuration (No API key required)
The AI chatbot works out of the box with:
- Local sentence transformer models for embeddings
- FAISS for fast vector search
- Simple extractive responses

### Enhanced Configuration (With Gemini)
For higher quality responses, set up Gemini:
```bash
export GOOGLE_API_KEY="sk-your-key-here"
```

### Advanced Configuration
See [CONFIG.md](CONFIG.md) for detailed configuration options including:
- Custom embedding models
- Performance optimization
- Local LLM integration
- Production deployment settings

## Usage

### Standard File Operations
1. Create a new account using the sign-up feature
2. Log in to your account
3. Create folders to organize your files
4. Upload files to your folders
5. Share files with other users
6. Download shared files from other users

### AI-Powered Features
1. **Upload Text Documents**: Upload PDF, DOCX, or TXT files
2. **Wait for Processing**: Files are automatically processed for AI search
3. **Ask Questions**: Use the AI Chat interface to query your documents
4. **Get Intelligent Answers**: Receive responses with source attribution
5. **Explore Knowledge Base**: View statistics about your indexed documents

## Security Features

### Standard Security
- Password hashing using SHA-256
- Session-based authentication
- File size limits (500MB per file)
- Secure file storage using IPFS

### AI Security
- **User Data Isolation**: Each user's AI knowledge base is completely separate
- **No Cross-User Access**: Cannot access other users' document content
- **Privacy-First Design**: Documents processed locally, only queries sent to LLM APIs
- **Secure Vector Storage**: Encrypted local storage of document embeddings

## Architecture

### RAG Pipeline
```
File Upload → Text Extraction → Chunking → Embedding → Vector DB Storage
                                                            ↓
User Query → Query Embedding → Vector Search → Context → LLM → Response
```

### Components
- **Text Extractors**: PDF (PyPDF2), DOCX (python-docx), TXT (UTF-8)
- **Chunking**: LangChain RecursiveCharacterTextSplitter
- **Embeddings**: Sentence Transformers (default: all-MiniLM-L6-v2)
- **Vector DB**: FAISS with per-user isolation
- **LLM**: Gemini 2.5 Flash (optional) or extractive fallback

## API Endpoints

### New AI Endpoints
- `POST /chat` - Send a question to the AI chatbot
- `GET /chat/stats` - Get statistics about user's knowledge base

### Standard Endpoints  
- `POST /login` - User authentication
- `POST /signup` - User registration
- `POST /upload` - File upload (now includes AI processing)
- `POST /download` - File download
- `POST /create-folder` - Folder creation
- `POST /share` - File sharing
- `DELETE /delete` - File/folder deletion

## Development

### Adding New File Types
To support additional file formats, extend the `extract_text_from_file` method in `backend/rag_utils.py`:

```python
def _extract_from_new_format(self, file_content: bytes) -> str:
    # Custom extraction logic
    return extracted_text
```

### Custom LLM Integration
Integrate local or custom LLMs by extending the `LLMIntegration` class:

```python
class CustomLLMIntegration(LLMIntegration):
    def generate_answer(self, query, context_chunks, max_tokens=500):
        # Custom implementation
        return response
```

## Performance Considerations

- **Embedding Generation**: ~1-2 seconds per document on CPU
- **Vector Search**: Sub-second response times
- **Storage**: ~1MB per 1000 text chunks
- **Memory**: 2-4GB RAM recommended for production

## Troubleshooting

### Common Issues
1. **AI responses not working**: Check if documents are text-based (PDF/DOCX/TXT)
2. **Slow processing**: Ensure adequate RAM and consider GPU acceleration
3. **Vector DB errors**: Ensure `backend/vector_db/` directory has write permissions


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- **AI/ML Libraries**: Sentence Transformers, FAISS, LangChain
- **IPFS**: For decentralized file storage
- **ResilientDB**: For metadata management
- **Gemini**: For high-quality language model responses
- **React & Material-UI**: For the beautiful frontend interface

---

## Quick Start Example

```bash
# 1. Set up the environment
git clone https://github.com/NoBugInMyCode/ResShareDeployable.git
cd ResShareDeployable
pip install -r requirements.txt

# 2. (Optional) Set up Gemini for better AI responses
export GOOGLE_API_KEY="your-key-here"

# 3. Start services
ipfs daemon &
python app.py &
cd frontend && npm start

# 4. Open http://localhost:3000 and enjoy!
```

