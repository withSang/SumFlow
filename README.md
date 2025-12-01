# SumFlow

SumFlow is a modern, text-based calculation notepad that combines the flexibility of a text editor with the power of a spreadsheet. It allows you to write calculations in natural language, handle unit conversions, and reference variables seamlessly.

Visit [http://sumflow.withsang.com/](http://sumflow.withsang.com/).

<img width="768" alt="image" src="https://github.com/user-attachments/assets/3996d794-6645-4429-8878-f9884340d1d3" />

## Features

*   **Natural Language Math**: Write math as you think. `Salary = 5000`, `Tax = 10%`, `Net = Salary - Tax`.
*   **Live Calculation**: Results appear instantly next to your text in a clean, non-intrusive way.
*   **Unit Conversions**: Built-in support for Length, Mass, Time, and Currency.
    *   `10 km in miles`
    *   `5 kg + 2 lbs`
    *   `100 USD in EUR` (Static demo rates)
*   **Smart References**:
    *   Reference previous lines using variables you define.
    *   Use `prev` or `previous` to refer to the result of the line immediately above.
    *   Use `lineN` (e.g., `line1`) to refer to specific lines.
*   **Currency Support**: Symbols like `$, €, £, ¥, ₩` are automatically recognized.
*   **Dark & Light Mode**: A beautiful interface that adapts to your preference.
*   **Local Persistence**: Your sheets are saved automatically to your browser's local storage.
*   **Import / Export**: Backup your data to JSON or share sheets with others.

## Tech Stack

*   **React** (Vite)
*   **TypeScript**
*   **Ant Design** (UI Components)
*   **Tailwind CSS** (Styling)
*   **Math.js** (Calculation Engine)
*   **Zustand** (State Management)

## Getting Started

### Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/sumflow.git
    cd sumflow
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## Usage Tips

*   **New Line**: Press `Enter`.
*   **Delete Line**: Press `Backspace` on an empty line.
*   **Undo/Redo**: `Cmd+Z` / `Cmd+Shift+Z` (Mac) or `Ctrl+Z` / `Ctrl+Shift+Z` (Windows).
*   **Variables**: Assign values using `=` or `:`. (e.g., `Cost: 100`).
*   **Comments**: Use `//` for comments (e.g., `// Monthly Budget`).

## License

MIT

