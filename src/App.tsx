import React, { useRef, useState } from "react";
import {Chart, ChartData, registerables} from "chart.js";
import { Line } from "react-chartjs-2";
import {a} from "vite/dist/node/types.d-aGj9QkWt";

Chart.register(...registerables);

const ImageAnalysis = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [intensityChartData, setIntensityChartData] = useState<ChartData | null>(null);
    const [varianceChartData, setVarianceChartData] = useState<ChartData | null>(null);
    const [imageURL, setImageURL] = useState<string>();
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setImageURL(URL.createObjectURL(file));
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;

                img.onload = () => {
                    if (canvasRef.current) {
                        const { width, height } = img;
                        const ctx = canvasRef.current.getContext("2d");
                        if (ctx) {
                            canvasRef.current.width = width;
                            canvasRef.current.height = height;
                            ctx.drawImage(img, 0, 0);

                            const imageData = ctx.getImageData(0, 0, width, height);
                            const { data: pixels } = imageData;

                            const intensityData: number[] = [];
                            const varianceData: number[] = [];

                            for (let layers = 1; layers <= height; layers++) {
                                const { averageIntensity, variance } = calculateLayerStatistics(pixels, width, height, layers);
                                intensityData.push(averageIntensity);
                                varianceData.push(variance);
                            }

                            const labels = Array.from({ length: height }, (_, i) => `Layers ${i + 1}`);

                            setIntensityChartData(createChartData(labels, 'Average Pixel Intensity', intensityData, 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 0.2)'));
                            setVarianceChartData(createChartData(labels, 'Pixel Intensity Variance', varianceData, 'rgba(153, 102, 255, 1)', 'rgba(153, 102, 255, 0.2)'));
                        }
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateLayerStatistics = (pixels: Uint8ClampedArray, width: number, height: number, layers: number) => {
        let sumIntensity = 0;
        let sumSquareIntensity = 0;
        let count = 0;

        for (let y = height - layers; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                const intensity = 0.299 * r + 0.587 * g + 0.114 * b;
                sumIntensity += intensity;
                sumSquareIntensity += intensity * intensity;
                count++;
            }
        }

        const averageIntensity = count ? sumIntensity / count : 0;
        const variance = count ? (sumSquareIntensity / count) - (averageIntensity * averageIntensity) : 0;

        return { averageIntensity, variance };
    };

    const createChartData = (labels: string[], label: string, data: number[], borderColor: string, backgroundColor: string) => ({
        labels,
        datasets: [
            {
                label,
                data,
                borderColor,
                backgroundColor,
                borderWidth: 1,
            },
        ],
    });

    return (
        <div style={{
            width: '100%',
            height: '100%',
        }}>
            <div>
                <h2>Завантажте зображення для аналізу інтенсивності пікселів</h2>
                <p style={{color: 'indianred'}}>Цей прототип має проблеми з перформансом (може не оброблювати великі
                    зображення)</p>
                <input type="file" accept="image/*" onChange={handleImageUpload}/>
            </div>
            <div style={{
                display: 'flex',
                gap: 20,
            }}>
                <div>

                    <canvas ref={canvasRef} style={{display: "none"}}></canvas>
                    {intensityChartData && (
                        <div>
                            <h3>Графік середньої інтенсивності пікселів</h3>
                            <Line data={intensityChartData}/>
                        </div>
                    )}
                    {varianceChartData && (
                        <div>
                            <h3>Графік дисперсії інтенсивності пікселів</h3>
                            <Line data={varianceChartData}/>
                        </div>
                    )}
                </div>
                <div style={{
                    width: 500,
                    height: 500
                }}>
                    <h3>Завантажене зображення </h3>
                    <img style={{
                        objectFit: 'contain',
                        width: '100%',
                        height: '100%',
                    }} src={imageURL}/>
                </div>
            </div>
        </div>

    );
};

export default ImageAnalysis;
