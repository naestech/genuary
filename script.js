class BracketGenerator {
    constructor() {
        this.prompts = [];
        this.currentPair = 0;
        this.winners = [];
        this.losers = [];
        this.leftPrompt = document.getElementById('leftPrompt');
        this.rightPrompt = document.getElementById('rightPrompt');
        this.progressDisplay = document.getElementById('currentRound');
        this.exportButton = document.getElementById('exportButton');
        
        this.init();
    }

    async init() {
        await this.loadPrompts();
        this.shufflePrompts();
        this.setupListeners();
        this.showNextPair();
    }

    async loadPrompts() {
        const response = await fetch('allprompts.md');
        const text = await response.text();
        const lines = text.split('\n');
        this.prompts = [];
        
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith('JAN.')) {
                const dayMatch = line.match(/JAN\. (\d+)\./);
                if (dayMatch) {
                    const day = dayMatch[1];
                    const description = lines[i + 1].trim();
                    this.prompts.push({
                        day,
                        description
                    });
                }
            }
        }
    }

    shufflePrompts() {
        for (let i = this.prompts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.prompts[i], this.prompts[j]] = [this.prompts[j], this.prompts[i]];
        }
    }

    setupListeners() {
        this.leftPrompt.addEventListener('click', () => this.selectWinner(0));
        this.rightPrompt.addEventListener('click', () => this.selectWinner(1));
    }

    showNextPair() {
        if (this.currentPair * 2 >= this.prompts.length) {
            if (this.prompts.length === 1) {
                this.finishBracket();
            } else {
                this.startNextRound();
            }
            return;
        }

        const left = this.prompts[this.currentPair * 2];
        const right = this.prompts[this.currentPair * 2 + 1];

        this.leftPrompt.querySelector('.prompt-title').textContent = `Day ${left.day}`;
        this.leftPrompt.querySelector('.prompt-credit').textContent = left.description;
        
        this.rightPrompt.querySelector('.prompt-title').textContent = `Day ${right.day}`;
        this.rightPrompt.querySelector('.prompt-credit').textContent = right.description;

        this.updateProgress();
    }

    selectWinner(index) {
        const winner = this.prompts[this.currentPair * 2 + index];
        const loser = this.prompts[this.currentPair * 2 + (index === 0 ? 1 : 0)];
        this.winners.push(winner);
        this.losers.unshift(loser);
        this.currentPair++;
        this.showNextPair();
    }

    startNextRound() {
        this.prompts.forEach((prompt, i) => {
            if (!this.winners.includes(prompt) && !this.losers.includes(prompt)) {
                this.losers.unshift(prompt);
            }
        });
        
        this.prompts = [...this.winners];
        this.winners = [];
        this.currentPair = 0;
        this.showNextPair();
    }

    updateProgress() {
        const totalRounds = Math.ceil(Math.log2(this.prompts.length));
        const currentRound = Math.ceil(Math.log2(this.prompts.length)) - 
                            Math.ceil(Math.log2(this.prompts.length - this.currentPair * 2));
        this.progressDisplay.textContent = `Round ${currentRound}/${totalRounds}`;
    }

    finishBracket() {
        if (this.prompts.length > 1) {
            this.losers.unshift(this.prompts[1]);
        }
        
        // Clear the battle container
        const battleContainer = document.querySelector('.battle-container');
        battleContainer.innerHTML = '';
        
        // Create rankings display
        const rankingsDiv = document.createElement('div');
        rankingsDiv.className = 'rankings-display';
        
        // Add winner
        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'winner';
        winnerDiv.innerHTML = `
            <h2>🏆 Winner (1st Place)</h2>
            <p>Day ${this.prompts[0].day}: ${this.prompts[0].description}</p>
        `;
        rankingsDiv.appendChild(winnerDiv);
        
        // Add all other rankings
        const rankingsList = document.createElement('div');
        rankingsList.className = 'rankings-list';
        rankingsList.innerHTML = '<h2>Rankings</h2>';
        
        this.losers.forEach((prompt, index) => {
            if (prompt && prompt.day && prompt.description) {
                const rank = index + 2;
                rankingsList.innerHTML += `
                    <p>${rank}. Day ${prompt.day}: ${prompt.description}</p>
                `;
            }
        });
        
        rankingsDiv.appendChild(rankingsList);
        battleContainer.appendChild(rankingsDiv);
        
        // Update progress text
        this.progressDisplay.textContent = 'Tournament Complete!';
        
        // Keep export button functionality
        const oldButton = document.getElementById('exportButton');
        if (oldButton) {
            oldButton.remove();
        }
        
        const exportButton = document.createElement('button');
        exportButton.id = 'exportButton';
        exportButton.textContent = 'Export Rankings';
        exportButton.style.display = 'block';
        exportButton.onclick = () => this.exportRankings();
        
        document.querySelector('.container').appendChild(exportButton);
    }

    exportRankings() {
        try {
            // Check if we have a winner
            if (!this.prompts || !this.prompts[0]) {
                throw new Error('No winner found');
            }

            // Check if we have losers
            if (!this.losers) {
                throw new Error('No rankings found');
            }

            let content = `# Selected Genuary Prompts\n\n`;
            
            // Add winner
            content += `## Winner (1st Place)\n`;
            content += `Day ${this.prompts[0].day}: ${this.prompts[0].description}\n\n`;
            
            // Add all other rankings
            content += `## Rankings\n`;
            
            // Log for debugging
            console.log('Winner:', this.prompts[0]);
            console.log('Losers:', this.losers);
            
            // Add each loser to the rankings
            this.losers.forEach((prompt, index) => {
                if (prompt && prompt.day && prompt.description) {
                    const rank = index + 2;
                    content += `${rank}. Day ${prompt.day}: ${prompt.description}\n`;
                }
            });

            // Create and trigger download
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'selectedprompts.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Content being exported:', content);
        } catch (error) {
            console.error('Detailed error:', error);
            console.error('Winner state:', this.prompts);
            console.error('Loser state:', this.losers);
            alert(`Error exporting rankings: ${error.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BracketGenerator();
}); 