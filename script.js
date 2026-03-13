let players = [];

const rolesMap = {
    1: "Tank",
    2: "Healer",
    3: "Nameless",
    4: "Dualblade",
    5: "Fanbrella",
	6: "Everspring"
};

// --- Função Core ---
function updateData() {
    sortPlayersByRole();
    renderCandidates();
    savePlayers();
}

// --- Ordenação por rolesMap ---
function sortPlayersByRole() {
    players.sort((a, b) => {
        const idA = parseInt(Object.keys(rolesMap).find(key => rolesMap[key] === a.role));
        const idB = parseInt(Object.keys(rolesMap).find(key => rolesMap[key] === b.role));
        return idA - idB;
    });
}

// --- Funções de Storage ---
function savePlayers() {
    localStorage.setItem("players", JSON.stringify(players));
}

function loadPlayers() {
    const data = localStorage.getItem("players");
    if (data) {
        players = JSON.parse(data);
        renderCandidates();
    }
}

function saveBoard() {
    const boardState = [];
    cells.forEach(cell => {
        if (cell.firstChild) {
            const playerDiv = cell.firstChild;
            boardState.push({
                cellId: cell.dataset.cellId,
                name: playerDiv.textContent,
                role: playerDiv.className
            });
        } else {
            boardState.push({
                cellId: cell.dataset.cellId,
                name: null,
                role: null
            });
        }
    });
    localStorage.setItem("board", JSON.stringify(boardState));
}

function loadBoard() {
    const data = localStorage.getItem("board");
    if (!data)
        return;

    const boardState = JSON.parse(data);
    boardState.forEach(state => {
        const cell = document.querySelector(`[data-cell-id="${state.cellId}"]`);
        if (cell && state.name && state.role) {
            dropPlayer(cell, {
                name: state.name,
                role: state.role
            });
        } else if (cell) {
            cell.innerHTML = "";
            cell.className = "";
        }
    });
}

// Função auxiliar para calcular próxima ocorrência de um dia da semana
// Se hoje já for o dia desejado, retorna hoje
function getNextDayOfWeek(dayOfWeek) {
	const today = new Date();
	const resultDate = new Date(today.getTime());

	const diff = (dayOfWeek - today.getDay() + 7) % 7;
	// Se diff for 0, significa que hoje já é o dia desejado
	resultDate.setDate(today.getDate() + diff);
	return resultDate;
}

// Formata a data dd_mm_yy
function formatDate(date) {
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const yy = String(date.getFullYear()).slice(-2);
	return `${dd}_${mm}_${yy}`;
}

// Exporta imagem para sábado
function exportBoardSabado() {
	const nextSaturday = getNextDayOfWeek(6); // 6 = sábado
	const fileName = `sabado_${formatDate(nextSaturday)}.png`;

	exportCanvas(fileName);
}

// Exporta imagem para domingo
function exportBoardDomingo() {
	const nextSunday = getNextDayOfWeek(0); // 0 = domingo
	const fileName = `domingo_${formatDate(nextSunday)}.png`;

	exportCanvas(fileName);
}

function exportCanvas(fileName) {
    html2canvas(document.querySelector("#board"), {
		useCORS: true,
		allowTaint: false
    }).then(canvas => {
		const link = document.createElement("a");
		link.download = fileName;
		link.href = canvas.toDataURL("image/png"); // This line requires a non-tainted canvas
		link.click();
    }).catch(err => {
		console.error("Erro ao exportar:", err);
	});;
}

// --- Renderização dos inscritos ---
function renderCandidates() {
    const div = document.getElementById("candidates");
    div.innerHTML = "";
    players.forEach((p, i) => {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.marginBottom = "10px";

        const candidate = document.createElement("div");
        candidate.textContent = p.name;
        candidate.className = `candidate ${p.role}`;
        candidate.draggable = true;
        candidate.dataset.index = i;
        candidate.dataset.player = JSON.stringify(p);
        candidate.addEventListener("dragstart", dragStart);

        const actions = document.createElement("div");
        actions.className = "actions";

        const removeIcon = document.createElement("i");
        removeIcon.className = "fa fa-trash action-icon";
        removeIcon.title = "Remover";
		removeIcon.style.color = "#ff7466";
        removeIcon.onclick = () => removePlayer(i);
		
		const icon = document.createElement("img");
		icon.src = `icons/${p.role.toLowerCase()}.png`; // ex: icons/tank.png
		icon.alt = p.role;
		
		candidate.appendChild(icon);
		
        candidate.addEventListener("dblclick", () => {
            const modal = document.getElementById("editModal");
            const select = document.getElementById("playerSelect");
            select.innerHTML = "";

            // repopula o dropdown com todos os players
            players.forEach((p, idx) => {
                const option = document.createElement("option");
                option.value = idx;
                option.textContent = p.name;
                select.appendChild(option);
            });

            // seleciona o player clicado
            select.value = i;
            loadPlayerData(); // carrega os dados do player
            modal.style.display = "block"; // abre o modal
        });

        actions.appendChild(removeIcon);		
        container.appendChild(candidate);
        container.appendChild(actions);
        div.appendChild(container);
    });
}

// --- Modal de Adicionar ---
function openAddModal() {
    document.getElementById("addModal").style.display = "block";
}

function closeAddModal() {
    document.getElementById("addModal").style.display = "none";
}

function saveNewPlayer() {
    const name = document.getElementById("newName").value;
    const roleId = document.getElementById("newRole").value;
    if (!name)
        return;

    const role = rolesMap[roleId]; // sempre salva como nome
    players.push({
        name,
        role
    });

    updateData();
    closeAddModal();

    // limpa campos
    document.getElementById("newName").value = "";
    document.getElementById("newRole").value = "1";
}

// --- Modal de Editar ---
function openEditModal() {
    const modal = document.getElementById("editModal");
    const select = document.getElementById("playerSelect");
    select.innerHTML = "";

    players.forEach((p, idx) => {
        const option = document.createElement("option");
        option.value = idx;
        option.textContent = p.name;
        select.appendChild(option);
    });

    modal.style.display = "block";
    loadPlayerData(); // carrega o primeiro por padrão
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

function loadPlayerData() {
    const idx = document.getElementById("playerSelect").value;
    const player = players[idx];

    document.getElementById("editName").value = player.name;

    // encontra o id correspondente ao nome da role
    const roleId = Object.keys(rolesMap).find(key => rolesMap[key] === player.role);
    document.getElementById("editRole").value = roleId;
}

function savePlayerEdit() {
    const idx = document.getElementById("playerSelect").value;
    players[idx].name = document.getElementById("editName").value;

    const roleId = document.getElementById("editRole").value;
    players[idx].role = rolesMap[roleId]; // salva como nome

    updateData();
    closeEditModal();
}

// --- Remover player ---
function removePlayer(index) {
    players.splice(index, 1);
    updateData();
}

// --- Drag da lista de inscritos ---
function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.player);
}

// --- Função para adicionar inscrito dentro da célula ---
function dropPlayer(cell, player) {
    cell.innerHTML = "";
    cell.className = "";
	
	const playerDiv = document.createElement("div");
	playerDiv.className = player.role;
	playerDiv.style.color = "white";
	playerDiv.style.fontWeight = "bold";
	playerDiv.draggable = true;

	const nameSpan = document.createElement("span");
	nameSpan.textContent = player.name;

	const icon = document.createElement("img");
	icon.src = `icons/${player.role.toLowerCase()}.png`;
	icon.alt = player.role;

	playerDiv.appendChild(nameSpan);
	playerDiv.appendChild(icon);

    playerDiv.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", JSON.stringify(player));
        e.dataTransfer.setData("originCellId", cell.dataset.cellId);
    });

    cell.appendChild(playerDiv);
    cell.classList.add(player.role);
	
	saveBoard();
}

// --- Importar CSV ---
function loadCSV() {
    const input = document.getElementById("csvFile");
    const file = input.files[0];
    if (!file)
        return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split("\n");

        lines.forEach((line, idx) => {
            if (idx === 0)
                return;
            const [name, idRole] = line.split(",");
            if (name && idRole) {
                const role = rolesMap[idRole.trim()];
                if (role) {
                    const exists = players.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
                    if (!exists) {
                        players.push({
                            name: name.trim(),
                            role
                        });
                    }
                }
            }
        });

        updateData();
    };

    reader.readAsText(file);
}

// --- Eventos das células ---
const cells = document.querySelectorAll("td");
cells.forEach((cell, idx) => {
    cell.dataset.cellId = "cell-" + idx;

    cell.addEventListener("dragover", e => {
        e.preventDefault();
        cell.classList.add("over");
    });

    cell.addEventListener("dragleave", () => {
        cell.classList.remove("over");
    });

    cell.addEventListener("drop", e => {
        e.preventDefault();
        cell.classList.remove("over");

        const player = JSON.parse(e.dataTransfer.getData("text/plain"));
        const originCellId = e.dataTransfer.getData("originCellId");
        const originCell = originCellId ? document.querySelector(`[data-cell-id="${originCellId}"]`) : null;

        if (cell.firstChild) {
            // célula destino já ocupada → swap
            const existingPlayerDiv = cell.firstChild;
            const existingPlayer = {
                name: existingPlayerDiv.textContent,
                role: existingPlayerDiv.className
            };

            if (originCell && originCell !== cell) {
                dropPlayer(originCell, existingPlayer);
            }
            dropPlayer(cell, player);
        } else {
            // célula destino vazia → move e limpa origem
            dropPlayer(cell, player);
            if (originCell && originCell !== cell) {
                originCell.innerHTML = "";
                originCell.className = "";
            }
        }
    });

    cell.addEventListener("contextmenu", e => {
        e.preventDefault();
        cell.innerHTML = "";
        cell.className = "";
		
		saveBoard();
    });
});

function clearBoard() {
  cells.forEach(cell => {
    cell.innerHTML = "";
    cell.className = "";
  });
  localStorage.removeItem("board"); // limpa também o storage
}

window.onload = () => {
  loadPlayers();
  loadBoard();
};