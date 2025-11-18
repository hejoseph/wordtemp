import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { FileDropDirective } from './file-drop.directive';

@Component({
  selector: 'app-word-processor',
  standalone: true,
  imports: [CommonModule, FormsModule, FileDropDirective],
  templateUrl: './word-processor.component.html',
  styleUrls: ['./word-processor.component.css']
})
export class WordProcessorComponent {
  tags: string[] = [];
  tagValues: { [key: string]: string } = {};
  error: string | null = null;
  isLoading = false;
  isDragOver = false;
  private fileBuffer: ArrayBuffer | null = null;

  onFileDropped(file: File) {
    this.processFile(file);
  }

  // For the file input
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    if (!file.name.endsWith('.docx')) {
      this.error = "Invalid file type. Please upload a .docx file.";
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.tags = [];
    this.fileBuffer = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fileBuffer = e.target.result;
      if (!this.fileBuffer) {
        this.error = "Could not read the file.";
        this.isLoading = false;
        return;
      }
      try {
        const zip = new PizZip(this.fileBuffer);
        
        // Extract text from document.xml without parsing the template
        let documentXml = '';
        try {
          documentXml = zip.file('word/document.xml')?.asText() || '';
        } catch (xmlError) {
          console.error('Error reading document.xml:', xmlError);
        }

        // Also check headers and footers
        const headerFooterFiles = ['word/header1.xml', 'word/header2.xml', 'word/header3.xml', 
                                    'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];
        headerFooterFiles.forEach(fileName => {
          try {
            const content = zip.file(fileName)?.asText();
            if (content) {
              documentXml += ' ' + content;
            }
          } catch (e) {
            // File might not exist, which is fine
          }
        });

        // Extract text content from XML tags (remove all XML markup)
        // Match all <w:t>text</w:t> and <w:t xml:space="preserve">text</w:t> tags
        const textContentRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
        let textMatch;
        let fullText = '';
        while ((textMatch = textContentRegex.exec(documentXml)) !== null) {
          fullText += textMatch[1];
        }

        // Find all merge fields with the pattern «field_name»
        const regex = /«([^»]+)»/g;
        let match;
        const foundTags = new Set<string>();
        while ((match = regex.exec(fullText)) !== null) {
          const fieldName = match[1].trim();
          // Validate: field name should only contain lowercase letters, numbers, and underscores
          // and should not contain XML tags or special characters
          if (fieldName && /^[a-z0-9_]+$/.test(fieldName)) {
            foundTags.add(fieldName);
          } else {
            console.warn('Ignoring invalid field name:', fieldName);
          }
        }

        this.tags = Array.from(foundTags).sort();
        if (this.tags.length === 0) {
          this.error = "No merge fields found in the document. Ensure they are formatted as «field_name».";
        }
        this.tagValues = {};
        this.tags.forEach(tag => this.tagValues[tag] = '');
      } catch (e) {
        this.error = "Error reading the document. It might be corrupted or not a valid .docx file.";
        console.error('Document processing error:', e);
      } finally {
        this.isLoading = false;
      }
    };
    reader.onerror = () => {
      this.error = "Failed to read the file.";
      this.isLoading = false;
    };
    reader.readAsArrayBuffer(file);
  }

  generateDocument() {
    if (!this.fileBuffer) {
      this.error = "Please upload a file first.";
      return;
    }

    try {
      const zip = new PizZip(this.fileBuffer);
      const doc = new Docxtemplater(zip, {
        delimiters: { start: '«', end: '»' },
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.setData(this.tagValues);
      doc.render();

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, 'output.docx');
      this.error = null;
    } catch (e) {
      this.error = "An error occurred while generating the document.";
      console.error(e);
    }
  }
}
