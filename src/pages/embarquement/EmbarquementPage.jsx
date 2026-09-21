import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOutlined, StopOutlined } from "@ant-design/icons";
import { ticketsApi } from "../../api/resources";

const SCANNER_ELEMENT_ID = "embarquement-qr-reader";

const EmbarquementPage = () => {

    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState("");

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const scannerRef = useRef(null);
    const busyRef = useRef(false);

    const submitScan = async (value) => {
        const ticket_number = value.trim();
        if (!ticket_number || busyRef.current) return;
        busyRef.current = true;
        setError("");
        setResult(null);
        try {
            const res = await ticketsApi.scan(ticket_number);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Échec du scan.");
        } finally {
            busyRef.current = false;
        }
    };

    useEffect(() => {
        if (!cameraOn) {
            return;
        }

        setCameraError("");
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 260 },
            (decodedText) => {
                submitScan(decodedText);
            },
            () => {}
        ).catch(() => {
            setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            setCameraOn(false);
        });

        return () => {
            scanner.stop().then(() => scanner.clear()).catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraOn]);

    return (
        <div className="max-w-md mx-auto px-4 py-6">
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Embarquement</h1>
            <p className="text-sm text-slate-500 mb-6">Scannez le QR code du billet pour valider l'embarquement.</p>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <button
                    onClick={() => setCameraOn((v) => !v)}
                    className={`w-full flex items-center justify-center gap-2 text-base font-medium py-3 rounded-lg ${
                        cameraOn ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-900 text-white"
                    }`}
                >
                    {cameraOn ? <StopOutlined /> : <CameraOutlined />}
                    {cameraOn ? "Arrêter la caméra" : "Scanner avec la caméra"}
                </button>

                {cameraError && (
                    <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {cameraError}
                    </div>
                )}

                {cameraOn && (
                    <div id={SCANNER_ELEMENT_ID} className="mt-4 rounded-lg overflow-hidden" />
                )}
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-4 text-center text-base font-medium">
                    {error}
                </div>
            )}

            {result && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                    <div className="text-emerald-700 font-semibold text-base mb-2">✓ Ticket validé — embarquement autorisé</div>
                    <div className="text-sm text-slate-700 space-y-1">
                        <div><span className="text-slate-500">Ticket : </span>{result.ticket_number}</div>
                        {result.booking?.passenger && (
                            <div><span className="text-slate-500">Passager : </span>{result.booking.passenger.first_name} {result.booking.passenger.last_name}</div>
                        )}
                        {result.booking?.seat_number && (
                            <div><span className="text-slate-500">Siège : </span>{result.booking.seat_number}</div>
                        )}
                        {result.booking?.trip?.TripRoute && (
                            <div><span className="text-slate-500">Trajet : </span>{result.booking.trip.TripRoute.departure_city} → {result.booking.trip.TripRoute.arrival_city}</div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );

};

export default EmbarquementPage;
