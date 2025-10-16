import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'txt';
  title: string;
  author?: string;
  includePageNumbers?: boolean;
}

export class ExportService {
  private static readonly SCREENPLAY_MARGINS = {
    left: 1.5, // inches
    right: 1.0,
    top: 1.0,
    bottom: 1.0
  };

  private static readonly SCREENPLAY_FORMATTING = {
    sceneHeading: {
      fontSize: 12,
      fontStyle: 'normal' as const,
      leftMargin: 1.5,
      spacing: { before: 24, after: 12 }
    },
    action: {
      fontSize: 12,
      fontStyle: 'normal' as const,
      leftMargin: 1.5,
      rightMargin: 7.5,
      spacing: { before: 12, after: 12 }
    },
    character: {
      fontSize: 12,
      fontStyle: 'normal' as const,
      leftMargin: 3.7,
      spacing: { before: 12, after: 0 }
    },
    dialogue: {
      fontSize: 12,
      fontStyle: 'normal' as const,
      leftMargin: 2.5,
      rightMargin: 6.0,
      spacing: { before: 0, after: 12 }
    },
    parenthetical: {
      fontSize: 12,
      fontStyle: 'normal' as const,
      leftMargin: 3.1,
      rightMargin: 5.5,
      spacing: { before: 0, after: 0 }
    }
  };

  static async exportToPDF(content: string, options: ExportOptions): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    // Set up the document
    pdf.setFont('courier', 'normal');
    
    // Add title page if title is provided
    if (options.title) {
      this.addTitlePage(pdf, options);
      pdf.addPage();
    }

    // Parse and format the script content
    const elements = this.parseScriptContent(content);
    let currentY = this.SCREENPLAY_MARGINS.top;
    let pageNumber = 1;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      // Check if we need a new page
      if (currentY > 10) { // 10 inches from top (letter size is 11 inches)
        pdf.addPage();
        currentY = this.SCREENPLAY_MARGINS.top;
        pageNumber++;
        
        // Add page number if enabled
        if (options.includePageNumbers && pageNumber > 1) {
          pdf.setFontSize(12);
          pdf.text(`${pageNumber}.`, 7.5, 0.75);
        }
      }

      currentY = this.addElementToPDF(pdf, element, currentY);
    }

    // Download the PDF
    const filename = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(filename);
  }

  static async exportToTXT(content: string, options: ExportOptions): Promise<void> {
    let txtContent = '';
    
    // Add title if provided
    if (options.title) {
      txtContent += `${options.title.toUpperCase()}\n`;
      if (options.author) {
        txtContent += `by ${options.author}\n`;
      }
      txtContent += '\n\n';
    }

    // Add the script content with basic formatting
    const elements = this.parseScriptContent(content);
    
    for (const element of elements) {
      switch (element.type) {
        case 'scene-heading':
          txtContent += `${element.content.toUpperCase()}\n\n`;
          break;
        case 'character':
          txtContent += `                    ${element.content.toUpperCase()}\n`;
          break;
        case 'dialogue':
          txtContent += `          ${element.content}\n`;
          break;
        case 'parenthetical':
          txtContent += `                (${element.content})\n`;
          break;
        case 'action':
          txtContent += `${element.content}\n\n`;
          break;
        default:
          txtContent += `${element.content}\n`;
      }
    }

    // Download the TXT file
    const filename = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static addTitlePage(pdf: jsPDF, options: ExportOptions): void {
    const pageWidth = 8.5;
    const pageHeight = 11;
    
    // Center the title vertically and horizontally
    pdf.setFontSize(24);
    pdf.setFont('courier', 'bold');
    
    const titleWidth = pdf.getTextWidth(options.title);
    const titleX = (pageWidth - titleWidth) / 2;
    const titleY = pageHeight / 2 - 1;
    
    pdf.text(options.title.toUpperCase(), titleX, titleY);
    
    if (options.author) {
      pdf.setFontSize(14);
      pdf.setFont('courier', 'normal');
      
      const byLine = `by ${options.author}`;
      const byWidth = pdf.getTextWidth(byLine);
      const byX = (pageWidth - byWidth) / 2;
      const byY = titleY + 0.5;
      
      pdf.text(byLine, byX, byY);
    }
  }

  private static parseScriptContent(content: string): Array<{type: string, content: string}> {
    const lines = content.split('\n');
    const elements: Array<{type: string, content: string}> = [];
    
    for (let line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Detect element type based on formatting patterns
      if (this.isSceneHeading(trimmedLine)) {
        elements.push({ type: 'scene-heading', content: trimmedLine });
      } else if (this.isCharacterName(trimmedLine)) {
        elements.push({ type: 'character', content: trimmedLine });
      } else if (this.isParenthetical(trimmedLine)) {
        elements.push({ type: 'parenthetical', content: trimmedLine.slice(1, -1) }); // Remove parentheses
      } else if (this.isDialogue(trimmedLine, elements)) {
        elements.push({ type: 'dialogue', content: trimmedLine });
      } else {
        elements.push({ type: 'action', content: trimmedLine });
      }
    }
    
    return elements;
  }

  private static isSceneHeading(line: string): boolean {
    const sceneHeadingPattern = /^(INT\.|EXT\.|FADE IN:|FADE OUT:|CUT TO:)/i;
    return sceneHeadingPattern.test(line.trim());
  }

  private static isCharacterName(line: string): boolean {
    // Character names are typically all caps and not too long
    const trimmed = line.trim();
    return trimmed === trimmed.toUpperCase() && 
           trimmed.length > 0 && 
           trimmed.length < 30 && 
           !this.isSceneHeading(trimmed) &&
           !trimmed.includes('.') &&
           !this.isParenthetical(trimmed);
  }

  private static isParenthetical(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('(') && trimmed.endsWith(')');
  }

  private static isDialogue(_line: string, previousElements: Array<{type: string, content: string}>): boolean {
    // Dialogue typically follows a character name or another dialogue line
    if (previousElements.length === 0) return false;
    
    const lastElement = previousElements[previousElements.length - 1];
    return lastElement.type === 'character' || 
           lastElement.type === 'dialogue' || 
           lastElement.type === 'parenthetical';
  }

  private static addElementToPDF(pdf: jsPDF, element: {type: string, content: string}, currentY: number): number {
    const formatting = this.SCREENPLAY_FORMATTING[element.type as keyof typeof this.SCREENPLAY_FORMATTING] || 
                      this.SCREENPLAY_FORMATTING.action;
    
    // Add spacing before element
    currentY += formatting.spacing.before / 72; // Convert points to inches
    
    // Set font properties
    pdf.setFontSize(formatting.fontSize);
    pdf.setFont('courier', formatting.fontStyle);
    
    // Calculate text wrapping
    const rightMargin = 'rightMargin' in formatting ? formatting.rightMargin : this.SCREENPLAY_MARGINS.right;
    const maxWidth = 8.5 - formatting.leftMargin - rightMargin;
    const lines = pdf.splitTextToSize(element.content, maxWidth);
    
    // Add each line
    for (const textLine of lines) {
      pdf.text(textLine, formatting.leftMargin, currentY);
      currentY += 12 / 72; // 12 points line height converted to inches
    }
    
    // Add spacing after element
    currentY += formatting.spacing.after / 72;
    
    return currentY;
  }
}