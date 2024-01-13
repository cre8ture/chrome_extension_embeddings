if (window.location.href.endsWith('editDocuments.html')) {
document.addEventListener('DOMContentLoaded', function () {
const documents = [
    { title: 'Document 1', sentences: ['Sentence 1', 'Sentence 2', 'Sentence 3'] },
    // More documents...
];

const container = document.getElementById('document-container');

document.getElementById('back').addEventListener('click', function() {
    window.history.back();
  });

documents.forEach((doc, index) => {
    const docElement = document.createElement('div');
    docElement.className = 'document';

    const titleElement = document.createElement('h2');
    titleElement.textContent = doc.title;
    docElement.appendChild(titleElement);

    const sentencesElement = document.createElement('div');
    sentencesElement.className = 'sentences hidden';
    doc.sentences.forEach(sentence => {
        const sentenceElement = document.createElement('p');
        sentenceElement.textContent = sentence;
        sentencesElement.appendChild(sentenceElement);
    });
    docElement.appendChild(sentencesElement);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.addEventListener('click', () => {
        container.removeChild(docElement);
    });
    docElement.appendChild(deleteButton);

    titleElement.addEventListener('click', () => {
        sentencesElement.classList.toggle('hidden');
    });

    container.appendChild(docElement);
});
});
}