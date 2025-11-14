import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-word-processor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-processor.component.html',
  styleUrls: ['./word-processor.component.css']
})
export class WordProcessorComponent {
  tags: string[] = [];
  tagValues: { [key: string]: string } = {};
  error: string | null = null;
  private fileBuffer: ArrayBuffer | null = null;

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.error = null;
      this.tags = [];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fileBuffer = e.target.result;
        if (!this.fileBuffer) {
          this.error = "Could not read the file.";
          return;
        }
        try {
          const zip = new PizZip(this.fileBuffer);
          const doc = new Docxtemplater(zip, {
            delimiters: { start: '{{', end: '}}' },
            paragraphLoop: true,
            linebreaks: true,
          });

          // Using a parser module is the most reliable way to get tags
          const text = doc.getFullText();
          const regex = /\{\{([^\s{}]+)\}\}/g;
          let match;
          const foundTags = new Set<string>();
          while ((match = regex.exec(text)) !== null) {
            foundTags.add(match[1]);
          }

          this.tags = Array.from(foundTags);
          if (this.tags.length === 0) {
            this.error = "No tags found in the document. Ensure they are formatted as {{tag}}.";
          }
          this.tagValues = {};
          this.tags.forEach(tag => this.tagValues[tag] = '');
        } catch (e) {
          this.error = "Error reading the document. It might be corrupted or not a valid .docx file.";
          console.error(e);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  generateDocument() {
    if (!this.fileBuffer) {
      this.error = "Please upload a file first.";
      return;
    }

    try {
      const zip = new PizZip(this.fileBuffer);
      const doc = new Docxtemplater(zip, {
        delimiters: { start: '{{', end: '}}' },
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
