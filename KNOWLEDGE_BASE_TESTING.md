# Knowledge Base Manual Testing Plan

This document outlines the steps for manually verifying the core functionality of the Knowledge Base (RAG) feature.

## 1. Environment Verification
- **API**: Running on `http://localhost:3000`
- **Admin UI**: Running on `http://localhost:3001`
- **WordPress/Widget**: Running on `http://localhost:8000`
- **User**: `ijharkin@gmail.com`

## 2. Test Cases

### Test Case 1: PDF Ingestion & Chunking
- **Action**: In the Admin Dashboard -> Knowledge Base, upload a PDF file (e.g., gym rules or schedules).
- **Verification**:
    - [ ] Success message appears: "Uploaded and indexed successfully".
    - [ ] New row appears in the document table.
    - [ ] "Knowledge Chunks" column shows a non-zero count.

### Test Case 2: Multi-Format Support (.docx, .txt)
- **Action**: Upload a `.docx` file and a `.txt` file with different fitness-related content.
- **Verification**:
    - [ ] Both files are processed without error.
    - [ ] Both files appear in the table with correct chunk counts.

### Test Case 3: RAG Retrieval (AI Answer)
- **Action**: Open the Widget on the WordPress site. Ask a specific question found only in one of the uploaded documents.
- **Verification**:
    - [ ] AI provides a correct answer derived from the document.
    - [ ] (Optional) Toggle "Why did I say this?" to verify the source and context used.

### Test Case 4: Knowledge Purge (Deletion)
- **Action**: In the Admin Dashboard, delete one of the uploaded documents using the trash icon.
- **Verification**:
    - [ ] Document is removed from the list.
    - [ ] Ask the same question in the widget again.
    - [ ] AI should no longer be able to answer specifically about that document (unless the information exists elsewhere).

### Test Case 5: Conflict Handling
- **Action**: Attempt to upload a file type that is not supported (e.g., an image or .zip).
- **Verification**:
    - [ ] UI shows an error message: "Invalid file type".

## 3. Iron Oasis Handbook Test Suite

This suite uses the generated `Mock_Gym_Handbook.html` to verify high-accuracy RAG retrieval.

### Setup: Generate the PDF
1. Open `Mock_Gym_Handbook.html` in your browser.
2. Press `Ctrl + P` (or `Cmd + P`).
3. Select **"Save as PDF"** and name it `Iron_Oasis_Handbook.pdf`.
4. Upload this file in the **Knowledge Base** tab.

### Verification Challenges
Ask the Bot these specific questions to verify it is reading the document accurately:

| Question | Expected Knowledge Point |
| :--- | :--- |
| **"What happens if I forget my sweat towel?"** | Should mention you can't work out OR you can rent a blue towel for $2. |
| **"What is the code for the secret sauna?"** | Should provide the keypad code `8822#`. |
| **"When are the low impact hours?"** | Should mention `2:00 PM to 4:00 PM` daily. |
| **"Who teaches Midnight Yoga?"** | Should identify **Master Zen**. |
| **"How do I cancel without a fee?"** | Should mention the `29-day` notice period and the `15-mile` relocation waiver. |

---
*Updated on: 2026-02-12*
