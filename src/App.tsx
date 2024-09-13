import React, { useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";

Chart.register(...registerables);

const ImageAnalysis = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [intensityChartData, setIntensityChartData] = useState<any>({});
    const [varianceChartData, setVarianceChartData] = useState<any>({});

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;

                img.onload = () => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            canvas.width = img.width;
                            canvas.height = img.height;

                            ctx.drawImage(img, 0, 0);

                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const pixels = imageData.data;
                            const width = imageData.width;
                            const height = imageData.height;

                            const intensityData: number[] = [];
                            const varianceData: number[] = [];

                            for (let layers = 0; layers <= height; layers++) {
                                let sumIntensity = 0;
                                let sumSquareIntensity = 0;
                                let count = 0;

                                for (let y = 0; y < layers; y++) {
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

                                const averageIntensity = sumIntensity / count;
                                const variance = (sumSquareIntensity / count) - (averageIntensity * averageIntensity);

                                intensityData.push(averageIntensity);
                                varianceData.push(variance);
                            }
                            console.log('intensityData: ', intensityData)
                            const labels = Array.from({ length: height }, (_, i) => `Layers ${i + 1}`);

                            setIntensityChartData({
                                labels,
                                datasets: [
                                    {
                                        label: 'Average Pixel Intensity',
                                        data: intensityData,
                                        borderColor: 'rgba(75, 192, 192, 1)',
                                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                        borderWidth: 1,
                                    },
                                ],
                            });

                            setVarianceChartData({
                                labels,
                                datasets: [
                                    {
                                        label: 'Pixel Intensity Variance',
                                        data: varianceData,
                                        borderColor: 'rgba(153, 102, 255, 1)',
                                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                        borderWidth: 1,
                                    },
                                ],
                            });
                        }
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <h2>Завантажте зображення для аналізу інтенсивності пікселів</h2>
            <p style={{
                color: 'indianred'
            }}>Цей прототип має проблеми з перформансом</p>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            {intensityChartData.labels && intensityChartData.datasets && (
                <div>
                    <h3>Графік середньої інтенсивності пікселів</h3>
                    <Line data={intensityChartData} />
                </div>
            )}
            {varianceChartData.labels && varianceChartData.datasets && (
                <div>
                    <h3>Графік дисперсії інтенсивності пікселів</h3>
                    <Line data={varianceChartData} />
                </div>
            )}
        </div>
    );
};

export default ImageAnalysis;
