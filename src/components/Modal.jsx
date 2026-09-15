const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg leading-none">
                    ×
                </button>
            </div>
            <div className="p-5">
                {children}
            </div>
        </div>
    </div>
);

export default Modal;
