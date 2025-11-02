# Document Upload Feature

## Overview

You can now upload law documents (HTML, PDF, TXT, DOC, etc.) to your CRM dashboard. Documents are stored alongside law data and can be viewed, downloaded, or edited.

## Features

✅ **Drag & Drop Upload** - Simply drag documents into the upload area
✅ **Multiple Format Support** - HTML, PDF, TXT, DOC, DOCX
✅ **HTML Preview** - View HTML documents with live preview or source code
✅ **Download Documents** - Download original documents anytime
✅ **Edit Mode** - Upload or replace documents when editing laws
✅ **Database Storage** - Documents stored in both JSON and PostgreSQL

## How to Use

### Adding a Document to a New Law

1. Click **"Add New Law"** button
2. In the form, you'll see a **"Law Document (Optional)"** section
3. Either:
   - **Drag and drop** your document into the upload area, or
   - **Click** to browse and select a file
4. Fill in the law details
5. Click **"Create Law"**

### Adding a Document to an Existing Law

1. Click on any law in the table to open details
2. Click the **"Edit"** button
3. In the **"Law Document"** section:
   - Upload a new document (drag & drop or browse)
   - Or remove the existing document by clicking the X
4. Click **"Save Changes"**

### Viewing Documents

1. Open a law that has a document attached
2. You'll see the document info with two buttons:
   - **"View"** - Opens the document viewer (with preview for HTML files)
   - **"Download"** - Downloads the original file

### Document Viewer

For HTML documents, you can:
- **Preview** tab - See the rendered HTML
- **Source** tab - View the raw HTML code

For other file types, the viewer shows the raw content.

## Supported File Types

- **HTML** (.html, .htm) - Full preview support
- **PDF** (.pdf) - Text content display
- **Text** (.txt) - Plain text display
- **Word** (.doc, .docx) - Text content display

## Technical Details

### Database Schema

Documents are stored with these fields:
- `document_filename` - Original filename
- `document_content` - Full file content (text)
- `document_content_type` - MIME type
- `document_uploaded_at` - Upload timestamp

### Size Limits

- Maximum file size: 10MB
- Stored as text in the database
- Large files may impact performance

### Storage Locations

- **JSON Mode**: Stored in `data/database.json` under each law
- **PostgreSQL Mode**: Stored in `laws` table columns

## Components

- **`DocumentUpload.tsx`** - Upload component with drag & drop
- **`DocumentViewer.tsx`** - Document preview/viewer modal
- **`AddLawModal.tsx`** - Updated to include document upload
- **`LawDetailsModal.tsx`** - Updated to display and manage documents

## API Updates

The law endpoints now accept and return document data:

```typescript
// Create/Update law with document
POST /api/laws/[lawId]
{
  "jurisdiction": "...",
  "status": "...",
  // ... other fields
  "document": {
    "filename": "law-document.html",
    "content": "<!DOCTYPE html>...",
    "contentType": "text/html",
    "uploadedAt": "2025-11-02T10:30:00.000Z"
  }
}
```

## Examples

### Upload an HTML Law Document

1. Create a new law or edit existing
2. Upload your HTML file containing the full law text
3. View the rendered document in the preview
4. Download or share the original document

### Use Cases

- **Legal Research** - Store full law documents for reference
- **Compliance** - Keep original regulatory documents
- **Analysis** - Attach source materials to laws
- **Documentation** - Provide supporting evidence for impact analysis

## Future Enhancements

Possible future improvements:
- [ ] PDF rendering in browser
- [ ] Document search within content
- [ ] Multiple documents per law
- [ ] Document version history
- [ ] OCR for scanned documents
- [ ] AI-powered document analysis
