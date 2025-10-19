/**
 * @jest-environment jsdom
 */

// Helper to load the pdf module with a fresh mocked jsPDF that returns fakeDoc
function withIsolatedPDFModule(fakeDoc, cb) {
  jest.isolateModules(() => {
    // Provide a module-scoped mock so the import inside the PDF module uses this instance
    jest.doMock('jspdf', () => ({ jsPDF: jest.fn(() => fakeDoc) }));
    // eslint-disable-next-line global-require
    const mod = require('../app/pages/inbox/lib/pdf');
    cb(mod);
  });
}

function makeFullDoc(overrides = {}) {
  const calls = [];
  const doc = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setDrawColor: jest.fn((...a) => calls.push(['setDrawColor', ...a])),
    setLineWidth: jest.fn((...a) => calls.push(['setLineWidth', ...a])),
    setFillColor: jest.fn((...a) => calls.push(['setFillColor', ...a])),
    rect: jest.fn((...a) => calls.push(['rect', ...a])),
    line: jest.fn((...a) => calls.push(['line', ...a])),
    circle: jest.fn((...a) => calls.push(['circle', ...a])),
    setFont: jest.fn((...a) => calls.push(['setFont', ...a])),
    setFontSize: jest.fn((...a) => calls.push(['setFontSize', ...a])),
    setTextColor: jest.fn((...a) => calls.push(['setTextColor', ...a])),
    text: jest.fn((...a) => calls.push(['text', ...a])),
    addPage: jest.fn((...a) => calls.push(['addPage', ...a])),
    splitTextToSize: jest.fn((text, w) => Array.from({ length: 3 }, (_, i) => `line ${i+1}`)),
    save: jest.fn(),
    ...overrides,
  };
  doc._calls = calls;
  return doc;
}

describe('pdf helpers - generateLetterPDF', () => {
  test('short-circuits when drawing APIs are missing and calls save("Letter.pdf")', () => {
    const fakeDoc = { save: jest.fn() }; // minimal doc, missing drawing APIs
    withIsolatedPDFModule(fakeDoc, ({ generateLetterPDF }) => {
      const msg = { text: 'Hello', deliveryTime: Date.now() };
      generateLetterPDF({ msg, isSender: true, recipientName: 'Alice', openChat: null });
      expect(fakeDoc.save).toHaveBeenCalledWith('Letter.pdf');
    });
  });

  test('renders and calls save with Letter_ prefix when APIs available', () => {
    const fakeDoc = makeFullDoc();
    withIsolatedPDFModule(fakeDoc, ({ generateLetterPDF }) => {
      const msg = { text: 'Hello there, this is a sample letter body.', deliveryTime: Date.UTC(2024, 0, 2) };
      generateLetterPDF({ msg, isSender: false, recipientName: 'Bob', openChat: { userProfiles: [{ uid: 'u1', username: 'Sam' }] } });
      // ensures decorative drawing happened
      expect(fakeDoc.setDrawColor).toHaveBeenCalled();
      expect(fakeDoc.rect).toHaveBeenCalled();
      expect(fakeDoc.text).toHaveBeenCalled();
      // filename should start with Letter_
      expect(fakeDoc.save).toHaveBeenCalledWith(expect.stringMatching(/^Letter_/));
    });
  });
});

describe('pdf helpers - generateChatTranscriptPDF', () => {
  test('short-circuits when core APIs are missing and calls save("ChatTranscript.pdf")', () => {
    const fakeDoc = { save: jest.fn() };
    withIsolatedPDFModule(fakeDoc, ({ generateChatTranscriptPDF }) => {
      const messages = [{ sender: 'a', text: 'hi', deliveryTime: Date.now() }];
      generateChatTranscriptPDF({ messages, currentUserID: 'a', userProfiles: [{ uid: 'a', username: 'Me' }] });
      expect(fakeDoc.save).toHaveBeenCalledWith('ChatTranscript.pdf');
    });
  });

  test('renders multiple lines and may add pages; saves transcript file', () => {
    const fakeDoc = makeFullDoc({
      // Return plenty of lines to exercise addPage branch in the loop
      splitTextToSize: jest.fn((text, w) => Array.from({ length: 60 }, (_, i) => `line ${i+1}`)),
    });
    withIsolatedPDFModule(fakeDoc, ({ generateChatTranscriptPDF }) => {
      const messages = [
        { sender: 'me', text: 'A'.repeat(500), deliveryTime: Date.now() },
        { sender: 'other', text: 'B'.repeat(500), deliveryTime: Date.now() },
      ];
      const userProfiles = [{ uid: 'me', username: 'You' }, { uid: 'other', username: 'Alex' }];
      generateChatTranscriptPDF({ messages, currentUserID: 'me', userProfiles });
      expect(fakeDoc.text).toHaveBeenCalled();
      expect(fakeDoc.save).toHaveBeenCalledWith('Pen_Pal_Correspondence.pdf');
      // With many lines, addPage should be likely called at least once
      expect(fakeDoc.addPage.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
