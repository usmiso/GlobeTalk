// PDF helpers for Inbox. Kept minimal to avoid coupling with React state.
import { jsPDF } from "jspdf";

export function generateLetterPDF({ msg, isSender, recipientName, openChat }) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  const dateStr = msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : '';
  doc.text(dateStr, 180, y);
  y += 16;

  let greetingName, signatureName;
  if (isSender) {
    greetingName = recipientName;
    signatureName = 'You';
  } else {
    greetingName = 'You';
    signatureName = (openChat?.userProfiles && openChat.userProfiles.find(u => u.uid === msg.sender)?.username) || msg.sender;
  }

  doc.setFontSize(14);
  doc.text(`Dear ${greetingName},`, margin, y);
  y += 12;

  doc.setFontSize(12);
  const lines = doc.splitTextToSize(msg.text, 170);
  doc.text(lines, margin, y);
  y += lines.length * 7 + 12;

  doc.setFontSize(13);
  doc.text('Kind regards,', margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(signatureName, margin, y);

  doc.save(`Letter_${dateStr}.pdf`);
}

export function generateChatTranscriptPDF({ messages, currentUserID, userProfiles }) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  const lineHeight = 6;

  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text("Chat Transcript", margin, y);
  y += 12;

  doc.setFontSize(11);
  const nowStr = new Date().toLocaleString();
  doc.text(`Generated: ${nowStr}`, margin, y);
  y += 10;

  messages.forEach((msg) => {
    if (!msg) return;
    const isSender = msg.sender === currentUserID;
    const senderName = isSender ? "You" : userProfiles?.find((u) => u.uid === msg.sender)?.username || msg.sender;
    const ts = msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleString() : '';

    const header = `${senderName} — ${ts}`;
    doc.setFontSize(12);
    doc.text(header, margin, y);
    y += lineHeight;

    const bodyLines = doc.splitTextToSize(msg.text || "", 170);
    bodyLines.forEach(line => {
      if (y > 280) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    y += lineHeight; // spacing between messages
  });

  doc.save("Chat_Transcript.pdf");
}
