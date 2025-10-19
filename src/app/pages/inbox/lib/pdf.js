// PDF helpers for Inbox. Kept minimal to avoid coupling with React state.
import { jsPDF } from "jspdf";

export function generateLetterPDF({ msg, isSender, recipientName, openChat }) {
  const doc = new jsPDF();
  const margin = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;
  
  // Set up decorative letter styling
  doc.setFont('times', 'normal');
  
  // Add ornate decorative border with multiple layers
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(1);
  doc.rect(margin - 8, margin - 8, pageWidth - 2 * margin + 16, pageHeight - 2 * margin + 16, 'S');
  
  // Inner decorative border
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.5);
  doc.rect(margin - 5, margin - 5, pageWidth - 2 * margin + 10, pageHeight - 2 * margin + 10, 'S');
  
  // Add ornate corner decorations
  const cornerSize = 15;
  doc.setLineWidth(2);
  doc.setDrawColor(60, 60, 60);
  
  // Top-left corner - ornate L shape
  doc.line(margin - 8, margin - 8, margin - 8 + cornerSize, margin - 8);
  doc.line(margin - 8, margin - 8, margin - 8, margin - 8 + cornerSize);
  doc.line(margin - 8 + cornerSize/2, margin - 8, margin - 8 + cornerSize/2, margin - 8 + cornerSize/2);
  doc.line(margin - 8, margin - 8 + cornerSize/2, margin - 8 + cornerSize/2, margin - 8 + cornerSize/2);
  
  // Top-right corner
  doc.line(pageWidth - margin + 8, margin - 8, pageWidth - margin + 8 - cornerSize, margin - 8);
  doc.line(pageWidth - margin + 8, margin - 8, pageWidth - margin + 8, margin - 8 + cornerSize);
  doc.line(pageWidth - margin + 8 - cornerSize/2, margin - 8, pageWidth - margin + 8 - cornerSize/2, margin - 8 + cornerSize/2);
  doc.line(pageWidth - margin + 8 - cornerSize/2, margin - 8 + cornerSize/2, pageWidth - margin + 8, margin - 8 + cornerSize/2);
  
  // Bottom-left corner
  doc.line(margin - 8, pageHeight - margin + 8, margin - 8 + cornerSize, pageHeight - margin + 8);
  doc.line(margin - 8, pageHeight - margin + 8, margin - 8, pageHeight - margin + 8 - cornerSize);
  doc.line(margin - 8 + cornerSize/2, pageHeight - margin + 8, margin - 8 + cornerSize/2, pageHeight - margin + 8 - cornerSize/2);
  doc.line(margin - 8, pageHeight - margin + 8 - cornerSize/2, margin - 8 + cornerSize/2, pageHeight - margin + 8 - cornerSize/2);
  
  // Bottom-right corner
  doc.line(pageWidth - margin + 8, pageHeight - margin + 8, pageWidth - margin + 8 - cornerSize, pageHeight - margin + 8);
  doc.line(pageWidth - margin + 8, pageHeight - margin + 8, pageWidth - margin + 8, pageHeight - margin + 8 - cornerSize);
  doc.line(pageWidth - margin + 8 - cornerSize/2, pageHeight - margin + 8, pageWidth - margin + 8 - cornerSize/2, pageHeight - margin + 8 - cornerSize/2);
  doc.line(pageWidth - margin + 8 - cornerSize/2, pageHeight - margin + 8 - cornerSize/2, pageWidth - margin + 8, pageHeight - margin + 8 - cornerSize/2);

  // Add decorative header background
  doc.setFillColor(219, 234, 254);
  doc.rect(margin - 5, margin - 5, pageWidth - 2 * margin + 10, 35, 'F');
  
  // Add decorative line under header
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(2);
  doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

  // Date in top-right with decorative styling
  const dateStr = msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  doc.setFontSize(11);
  doc.setTextColor(120, 100, 80);
  doc.setFont('times', 'italic');
  doc.text(dateStr, pageWidth - margin - 5, y + 15, { align: 'right' });
  y += 25;

  // Letter header with ornate styling
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.setFont('times', 'bold');
  const headerText = isSender ? "To my dear pen pal" : "From your pen pal";
  doc.text(headerText, margin, y);
  y += 10;
  
  // Recipient/Sender name with decorative styling
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont('times', 'italic');
  const nameText = isSender ? recipientName : (openChat?.userProfiles?.find(u => u.uid === msg.sender)?.username || "Unknown");
  doc.text(nameText, margin, y);
  y += 20;

  // Add decorative separator
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Greeting with ornate styling
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'italic');
  let greetingName, signatureName;
  if (isSender) {
    greetingName = recipientName;
    signatureName = 'Your pen pal';
  } else {
    greetingName = 'friend';
    signatureName = (openChat?.userProfiles && openChat.userProfiles.find(u => u.uid === msg.sender)?.username) || "Your pen pal";
  }
  
  doc.text(`Dear ${greetingName},`, margin, y);
  y += 20;

  // Letter body with enhanced formatting
  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.setFont('times', 'normal');
  const lines = doc.splitTextToSize(msg.text, 150);
  doc.text(lines, margin, y);
  y += lines.length * 7 + 25;

  // Closing with ornate styling
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.setFont('times', 'italic');
  doc.text('With warm regards,', margin, y);
  y += 15;
  
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(signatureName, margin, y);

  // Add decorative elements at the bottom
  y += 20;
  
  // Decorative line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  
  // Add wax seal simulation
  y += 10;
  doc.setFillColor(220, 38, 38);
  doc.circle(pageWidth - margin - 20, y, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('✉', pageWidth - margin - 20, y + 3, { align: 'center' });

  // Add page border decoration
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S');

  doc.save(`Letter_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function generateChatTranscriptPDF({ messages, currentUserID, userProfiles }) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;
  const lineHeight = 6;

  // Add decorative header
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(140, 100, 60);
  doc.text("Pen Pal Correspondence", margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(100, 80, 60);
  const nowStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${nowStr}`, margin, y);
  y += 15;

  // Add decorative line
  doc.setDrawColor(200, 180, 120);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  messages.forEach((msg, index) => {
    if (!msg) return;
    
    // Check if we need a new page
    if (y > 250) { 
      doc.addPage(); 
      y = margin; 
    }

    const isSender = msg.sender === currentUserID;
    const senderName = isSender ? "You" : userProfiles?.find((u) => u.uid === msg.sender)?.username || msg.sender;
    const ts = msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // Letter header
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.setFont("times", "bold");
    const letterTitle = `Letter ${index + 1} - ${isSender ? "To" : "From"} ${senderName}`;
    doc.text(letterTitle, margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Date: ${ts}`, margin, y);
    y += 8;

    // Greeting
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "normal");
    const greeting = isSender ? `Dear ${userProfiles?.find((u) => u.uid !== currentUserID)?.username || "friend"},` : "Dear friend,";
    doc.text(greeting, margin, y);
    y += 8;

    // Letter body
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const bodyLines = doc.splitTextToSize(msg.text || "", 160);
    bodyLines.forEach(line => {
      if (y > 250) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    y += 8;

    // Closing
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("With warm regards,", margin, y);
    y += 6;
    doc.setFont("times", "bold");
    doc.text(senderName, margin, y);
    y += 15;

    // Add separator line between letters
    if (index < messages.length - 1) {
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }
  });

  doc.save("Pen_Pal_Correspondence.pdf");
}
