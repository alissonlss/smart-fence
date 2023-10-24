// Selecionando elementos HTML
const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const closeWebcam = document.getElementById('closeWebcam');
const lineButton = document.getElementById('lineButton');

// Função para verificar se o acesso à webcam é suportado
function isUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Adicionar um evento de clique ao botão "Ativar Webcam"
if (isUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableWebcam);
} else {
    console.warn('getUserMedia() não é suportado pelo seu navegador');
}


// Função para ativar a webcam e começar a classificação
function enableWebcam(event) {
    // Verificar se o modelo COCO-SSD foi carregado
    if (!model) {
        return;
    }

    // Ocultar o botão após o clique
    event.target.classList.add('removed');

    // Parâmetros para solicitar somente vídeo
    const constraints = {
        video: true
    };

    // Ativar o stream da webcam
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });

    // Exibir o botão "Fechar Webcam" e o de ocultar linha
    closeWebcam.classList.remove('removed');
    lineButton.classList.remove('removed');

    video.scrollIntoView({ behavior: "smooth" })
}

// Variável para armazenar o modelo
var model = undefined;

// Carregar o modelo COCO-SSD e mostrar a seção de demonstração quando estiver pronto
function modelRun (){
    cocoSsd.load().then(function (loadedModel) {
        model = loadedModel;
        demosSection.classList.remove('invisible');
    });
}

modelRun();

// Array para armazenar elementos HTML
var children = [];

// variável para armazenar a existencia da linha
var lineExiste = false;


// Função para classificar frames da webcam
function predictWebcam() {
    const classMapping = ['person', 'dog', 'cat'];
    const bgColor = {'dog' : '#ff0381', 'cat' : '#6b026b'};
    const pets = ['dog', 'cat'];

    model.detect(video).then(function (predictions) {

        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        const videoWidth = video.getBoundingClientRect().width;
        const videoHeight = video.getBoundingClientRect().height;

        const middleY = videoHeight / 2;

        // Desenha uma linha horizontal no meio do quadro
        if (!lineExiste){
            const line = document.createElement('div');
            line.id = "line";

            line.style.position = 'absolute';
            line.style.top = middleY + 'px';
            line.style.left = '0';
            line.style.width = videoWidth + 'px';
            line.style.height = '2px'; // Espessura da linha
            line.style.backgroundColor = 'red'; // Cor da linha
        
            liveView.appendChild(line);
            lineExiste = true;
        }

        for (let n = 0; n < predictions.length; n++) {
            let fator = 1;

            if (predictions[n].score > 0.66 && classMapping.includes(predictions[n].class)) {
                const p = document.createElement('p');
                p.id = "confidence";

                if (videoWidth == "320" && videoHeight == "240"){
                    fator = 2;
                } else if(videoWidth == "272" && videoHeight == "192"){
                    fator = 2.5;
                }

                p.innerText = predictions[n].class + ' - com ' +
                    Math.round(parseFloat(predictions[n].score) * 100) +
                    '% de confiança.';
                p.style = 'margin-left: ' + predictions[n].bbox[0]/fator + 'px; margin-top: ' +
                    (predictions[n].bbox[1]/fator - 10) + 'px; width: ' +
                    (predictions[n].bbox[2]/fator - 10) + 'px; top: 0; left: 0;';

                if (pets.includes(predictions[n].class)){
                    p.style.backgroundColor = bgColor[predictions[n].class];
                }

                const highlighter = document.createElement('div');
                highlighter.id = "frame";

                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0]/fator + 'px; top: ' +
                    predictions[n].bbox[1]/fator + 'px; width: ' +
                    predictions[n].bbox[2]/fator + 'px; height: ' +
                    predictions[n].bbox[3]/fator + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                children.push(highlighter);
                children.push(p);
            }
        }

        window.requestAnimationFrame(predictWebcam);
    });
}


// Event listener para o botão "Fechar Webcam"
closeWebcam.addEventListener('click', () => {
    const confidence = document.getElementById('confidence');
    const frame = document.getElementById('frame');
    const line = document.getElementById('line');

    if (video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }

    // Ocultar o vídeo da visualização ao vivo
    if (confidence){
        liveView.removeChild(confidence);
    }
    if (frame){
       liveView.removeChild(frame); 
    }
    liveView.removeChild(line);
    
    // Ocultar o botão "Fechar Webcam" e o de "Ocultar Linha"
    closeWebcam.classList.add('removed');
    lineButton.classList.add('removed');

    // Exibir o botão "Ativar Webcam" novamente
    enableWebcamButton.classList.remove('removed');


    // reinicia as instancias
    children = []
    modelRun();
    lineExiste = false;

    // retorna ao todo
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    })

});


lineButton.addEventListener("click", () => {
    const textButton = {"Ocultar Linha": "Mostrar Linha", "Mostrar Linha": "Ocultar Linha"};
    const line = document.getElementById('line');
    const text = lineButton.textContent;

    if (text === "Ocultar Linha"){
        line.classList.add("removed");
    } else {
        line.classList.remove("removed");
    }

    lineButton.innerText = textButton[text];
});