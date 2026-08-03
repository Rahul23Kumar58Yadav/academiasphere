# 🎓 AcademiaSphere

**An AI-powered, multi-tenant school management platform connecting schools, teachers, parents, and students in one unified educational ecosystem.**

AcademiaSphere combines academic management, real-time communication, and an **LLM-powered RAG chatbot** into a single platform. It helps schools manage student activities while allowing parents, teachers, and students to access relevant academic information efficiently.

---

## 🚀 Overview

AcademiaSphere is a modern full-stack school management platform designed to digitize academic operations and communication.

The platform provides role-based access for **Admins, Teachers, Parents, and Students**, allowing users to manage and access attendance, academic performance, assignments, reports, and other school-related information.

A key feature of AcademiaSphere is its **Retrieval-Augmented Generation (RAG) chatbot**, which allows users to ask questions about institutional documents and academic policies. Instead of relying only on the LLM's existing knowledge, the system retrieves relevant information from uploaded documents and provides context-aware responses.

---

## 🎯 Key Features

### 👨‍🏫 Role-Based Access Control (RBAC)

- Dedicated portals for **Admins, Teachers, Parents, and Students**
- Secure authentication and authorization
- Role-based access to academic information and platform features
- Tenant-aware data access

### 📊 Student Performance Management

- Attendance tracking
- Marks and grade management
- Academic performance tracking
- Assignment management
- Academic report generation

### 💰 Fee Management

- Student fee records
- Payment history
- Pending fee tracking
- Fee-related information management

### 📅 Academic Activity Management

- Academic calendar
- Examination and event information
- School announcements
- Student activity tracking

### 💬 Real-Time Communication

- Teacher–parent communication
- Real-time notifications
- WebSocket-based updates
- Important academic and administrative notifications

---

## 🤖 LLM + RAG-Based AI Chatbot

AcademiaSphere includes an **LLM-powered Retrieval-Augmented Generation (RAG) chatbot** designed to make institutional information easier to access.

### 🔍 How It Works

```text
          📄 Institutional Documents
                    │
                    ▼
            Document Ingestion
                    │
                    ▼
             Text Processing
                    │
                    ▼
              Embeddings
                    │
                    ▼
             Vector Database
                    │
                    │
User Question ─────┤
                    ▼
          Semantic Retrieval
                    │
                    ▼
        Relevant Document Chunks
                    │
                    ▼
                  LLM
                    │
                    ▼
        Context-Aware Response
