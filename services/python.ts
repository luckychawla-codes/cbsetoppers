
let pyodidePromise: Promise<any> | null = null;

export const getPyodide = async () => {
    if (pyodidePromise) return pyodidePromise;

    pyodidePromise = (async () => {
        if (!(window as any).loadPyodide) {
            console.error("Pyodide script not loaded in index.html");
            return null;
        }
        const py = await (window as any).loadPyodide();
        await py.loadPackage(['matplotlib', 'numpy']);
        return py;
    })();

    return pyodidePromise;
};

export const runPythonDiagram = async (pyodide: any, code: string, elementId: string) => {
    if (!pyodide) return;
    try {
        const wrapperCode = `
import matplotlib.pyplot as plt
import io
import base64

plt.clf()
plt.close('all')

${code}

buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
buf.seek(0)
img_str = base64.b64encode(buf.read()).decode('utf-8')
"data:image/png;base64," + img_str
`;
        const result = await pyodide.runPythonAsync(wrapperCode);
        const img = document.getElementById(elementId) as HTMLImageElement;
        if (img) img.src = result;
    } catch (e: any) {
        console.error("Python Exec Error", e);
        const errDiv = document.getElementById(elementId + '-err');
        if (errDiv) errDiv.innerText = e.message;
    }
};
