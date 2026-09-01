# 🚀 BizInsight — Multi-Agent AI Business Intelligence Platform

BizInsight is a full-stack, AI-powered Business Intelligence platform that transforms business documents and company data into actionable, real-time insights.

It combines **Multi-Agent AI, RAG, LangGraph, LangChain, Hybrid Search, and LLM-powered analysis** to help businesses understand their data, discover trends and relationships, and make better decisions.

---

## 🎯 Problem

Businesses often have large numbers of reports and documents containing important financial, sales, inventory, product, and regional information.

Manually reviewing these documents makes it difficult to quickly identify important information, compare historical data, discover trends, and understand changes across the business.

BizInsight automates this process using AI-powered document analysis and retrieval.

---

## ✨ Key Features

### 🤖 Multi-Agent AI

Built with a **LangGraph-based multi-agent architecture** consisting of:

- **Supervisor Agent** — routes questions to the appropriate agent
- **RAG Agent** — answers document-related questions using retrieval
- **Company Agent** — handles company-specific questions using company tools
- **General Agent** — handles general questions using the LLM

### 📄 AI Document Analysis

- Upload and process business documents
- Extract text and structured information
- Extract numerical business metrics
- Generate embeddings for document chunks
- Store embeddings and metadata in ChromaDB
- Retrieve relevant historical context
- Identify trends, changes, patterns, and relationships
- Generate AI-powered business insights

### 🔎 RAG & Hybrid Search

The platform uses:

- Vector Search
- BM25 Keyword Search
- Hybrid Retrieval
- Result Fusion
- Reranking
- ChromaDB

Relevant document chunks are retrieved instead of sending entire documents to the LLM.

### 📊 Business Intelligence

The system can identify:

- Financial trends
- Revenue and profit changes
- Product performance
- Inventory changes
- Regional performance
- Historical changes
- Relationships between business metrics

Insights are displayed on dashboards and can be delivered through email notifications.

### 💬 AI Business Chatbot

Users can ask questions about company documents and business data through the AI chatbot.

### 👥 Company & User Management

Supports three roles:

- **Admin** — manages the overall company, users, departments, designations, and invitations
- **Manager** — manages department-level users and information
- **Employee** — accesses permitted features and uploads documents

### 🔐 Authentication

- JWT authentication
- Access and refresh tokens
- Role-based access control
- Account activation
- Password change
- Forgot password
- Password reset

### 📁 Document Management

- Upload
- Search
- Filter
- Sort
- Download
- Delete
- Processing status tracking

### 🔔 Notifications & Email

AI-generated business insights and important system events can be delivered through dashboard notifications and email.

### 💬 Real-Time Messaging

Real-time communication is implemented using **WebSockets**.

### 📈 Reports

The platform provides business reports and analytics including metrics, employee performance, activity, and document statistics.

---

## 🏗️ Architecture

### Document Analysis Flow

```text
User uploads document
        ↓
FastAPI Backend
        ↓
Text Extraction
        ↓
Text Chunking
        ↓
Embedding Generation
        ↓
ChromaDB
        ↓
Background Analysis Job
        ↓
Structured Information Extraction
        ↓
Historical Context Retrieval
        ↓
AI Analysis
        ↓
Business Insights
        ↓
MongoDB
        ↓
Dashboard + Email
