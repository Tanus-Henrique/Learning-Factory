// Mapeamento de predições numéricas para letras
const predictionsMap = {
  0: "A",
  1: "B",
  2: "C",
  3: "D"
};

document.getElementById('predict-form').addEventListener('submit', function(event) {
  event.preventDefault();

  const features = [
    Number(document.getElementById('age').value),
    Number(document.getElementById('gender').value),
    Number(document.getElementById('ethnicity').value),
    Number(document.getElementById('parentalEducation').value),
    Number(document.getElementById('studyTimeWeekly').value),
    Number(document.getElementById('absences').value),
    Number(document.querySelector('input[name="tutoring"]:checked').value),
    Number(document.getElementById('parentalSupport').value),
    Number(document.querySelector('input[name="extracurricular"]:checked').value),
    Number(document.querySelector('input[name="sports"]:checked').value),
    Number(document.querySelector('input[name="music"]:checked').value),
    Number(document.querySelector('input[name="volunteering"]:checked').value)
  ];

  fetch('http://127.0.0.1:5000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features })
  })
  .then(response => response.json())
  .then(data => {
    const resultP = document.getElementById('result');
    resultP.classList.remove('fade-in');

    if (data.predicao !== undefined) {
      const mappedText = predictionsMap[data.predicao] || "desconhecido";
      const message = `O aluno está na categoria: ${mappedText}.`;
      resultP.innerText = message;
    } else {
      resultP.innerText = 'Erro: ' + JSON.stringify(data);
    }

    void resultP.offsetWidth;
    resultP.classList.add('fade-in');
  })
  .catch(error => {
    console.error('Erro:', error);
    const resultP = document.getElementById('result');
    resultP.classList.remove('fade-in');
    resultP.innerText = 'Erro ao realizar a predição';
    void resultP.offsetWidth;
    resultP.classList.add('fade-in');
  });
});

// Função para limpar os campos do formulário
document.querySelector('.btn-clear').addEventListener('click', function() {
  document.getElementById('age').value = '';
  document.getElementById('studyTimeWeekly').value = '';
  document.getElementById('absences').value = '';
  document.getElementById('gender').value = '0'; 
  document.getElementById('ethnicity').value = '0';
  document.getElementById('parentalEducation').value = '0';
  document.getElementById('parentalSupport').value = '0';
  
  document.querySelector('input[name="tutoring"][value="0"]').checked = true;
  document.querySelector('input[name="extracurricular"][value="0"]').checked = true;
  document.querySelector('input[name="sports"][value="0"]').checked = true;
  document.querySelector('input[name="music"][value="0"]').checked = true;
  document.querySelector('input[name="volunteering"][value="0"]').checked = true;

  const resultP = document.getElementById('result');
  resultP.classList.remove('fade-in');
  resultP.innerText = '';
});

// Função para carregar as predições no dashboard
function loadPredicoes() {
  fetch('http://127.0.0.1:5000/predicoes')
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('#predictions-table tbody');
      tbody.innerHTML = ''; // Limpa tabelas existentes

      // Para cada predição retornada, cria uma linha na tabela
      data.forEach(item => {
        // Supondo que item tenha campos: data (opcional), entrada e predicao (já numérico)
        const row = document.createElement('tr');

        // Crie células, por exemplo, se item tiver 'data', 'entrada' e 'predicao':
        const cellData = document.createElement('td');
        cellData.innerText = item.data || 'N/D';
        row.appendChild(cellData);

        const cellEntrada = document.createElement('td');
        // Converter array de entrada em string ou formato desejado
        cellEntrada.innerText = Array.isArray(item.entrada) ? item.entrada.join(', ') : item.entrada;
        row.appendChild(cellEntrada);

        const cellPred = document.createElement('td');
        const mapped = predictionsMap[item.predicao] || item.predicao;
        cellPred.innerText = mapped;
        row.appendChild(cellPred);

        tbody.appendChild(row);
      });
    })
    .catch(error => console.error('Erro ao carregar predições:', error));
}
