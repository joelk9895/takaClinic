import { DailyTrends } from '../types/analytics';

export const extractFeatures = (data: number[], lagSize: number): { X: number[][], y: number[] } => {
  if (data.length <= lagSize) {
    return { X: [], y: [] };
  }
  
  const X: number[][] = [];
  const y: number[] = [];
  
  for (let i = lagSize; i < data.length; i++) {
    const features: number[] = [];
    
    for (let lag = 1; lag <= lagSize; lag++) {
      features.push(data[i - lag]);
    }
    
    const maSize = Math.min(3, lagSize);
    const maSum = features.slice(0, maSize).reduce((sum, val) => sum + val, 0);
    const ma = maSum / maSize;
    features.push(ma);
    
    const trend = features[0] - ma;
    features.push(trend);
    
    const cyclical = Math.sin(2 * Math.PI * (i % 7) / 7);
    features.push(cyclical);
    
    X.push(features);
    y.push(data[i]);
  }
  
  return { X, y };
};

export const calculateMSE = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
};

export const buildDecisionTree = (
  X: number[][], 
  y: number[], 
  maxDepth: number = 5, 
  minSamplesSplit: number = 2, 
  seed: number = 42
): { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> } => {
  if (maxDepth === 0 || y.length < minSamplesSplit) {
    return { isLeaf: true, value: y.reduce((sum, val) => sum + val, 0) / y.length || 0 };
  }

  let bestFeature = 0;
  let bestThreshold = 0;
  let bestScore = Infinity;
  for (let feature = 0; feature < X[0].length; feature++) {
    const values = X.map(x => x[feature]);
    const uniqueValues = [...new Set(values)];
    
    for (let i = 0; i < uniqueValues.length - 1; i++) {
      const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
      
      const leftIndices = [];
      const rightIndices = [];
      
      for (let j = 0; j < X.length; j++) {
        if (X[j][feature] <= threshold) {
          leftIndices.push(j);
        } else {
          rightIndices.push(j);
        }
      }
      
      if (leftIndices.length === 0 || rightIndices.length === 0) continue;
      
      const leftValues = leftIndices.map(idx => y[idx]);
      const rightValues = rightIndices.map(idx => y[idx]);
      
      const leftMSE = calculateMSE(leftValues);
      const rightMSE = calculateMSE(rightValues);
      
      const score = (leftValues.length * leftMSE + rightValues.length * rightMSE) / y.length;
      
      if (score < bestScore) {
        bestScore = score;
        bestFeature = feature;
        bestThreshold = threshold;
      }
    }
  }
  
  if (bestScore === Infinity) {
    return { isLeaf: true, value: y.reduce((sum, val) => sum + val, 0) / y.length || 0 };
  }
  const leftIndices = [];
  const rightIndices = [];
  
  for (let i = 0; i < X.length; i++) {
    if (X[i][bestFeature] <= bestThreshold) {
      leftIndices.push(i);
    } else {
      rightIndices.push(i);
    }
  }
  
  const leftX = leftIndices.map(idx => X[idx]);
  const leftY = leftIndices.map(idx => y[idx]);
  const rightX = rightIndices.map(idx => X[idx]);
  const rightY = rightIndices.map(idx => y[idx]);
  
  const leftSubtree = buildDecisionTree(leftX, leftY, maxDepth - 1, minSamplesSplit, seed * 2);
  const rightSubtree = buildDecisionTree(rightX, rightY, maxDepth - 1, minSamplesSplit, seed * 3);
  
  return {
    isLeaf: false,
    feature: bestFeature,
    threshold: bestThreshold,
    left: leftSubtree,
    right: rightSubtree
  };
};

export const predictWithTree = (
  tree: { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> },
  features: number[]
): number => {
  if (tree.isLeaf) {
    return tree.value ?? 0; // Provide default value to handle undefined case
  }
  
  if (tree.feature !== undefined && features[tree.feature] <= (tree.threshold ?? 0)) {
    return predictWithTree(tree.left as { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> }, features);
  } else {
    return predictWithTree(tree.right as { isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> }, features);
  }
};


export const buildRandomForest = (
  X: number[][], 
  y: number[], 
  numTrees: number = 10, 
  seed: number = 42
): Array<{ isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> }> => {
  const forest = [];
  
  const seededRandom = () => {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  };
  
  const random = seededRandom();
  
  for (let i = 0; i < numTrees; i++) {
    const sampleIndices = [];
    for (let j = 0; j < X.length; j++) {
      sampleIndices.push(Math.floor(random() * X.length));
    }
    
    const sampleX = sampleIndices.map(idx => X[idx]);
    const sampleY = sampleIndices.map(idx => y[idx]);
    
    const treeSeed = seed + (i * 1000);
    const tree = buildDecisionTree(sampleX, sampleY, 3, 2, treeSeed);
    forest.push(tree);
  }
  
  return forest;
};

export const predictWithForest = (
  forest: Array<{ isLeaf: boolean; value?: number; feature?: number; threshold?: number; left?: Record<string, unknown>; right?: Record<string, unknown> }>,
  features: number[]
): number => {
  const predictions = forest.map(tree => predictWithTree(tree, features));
  return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
};

export const simpleExponentialForecast = (data: number[], steps: number): number[] => {
  if (data.length === 0) return Array(steps).fill(0);
  
  const lastValue = data[data.length - 1];
  
  let totalGrowthRate = 0;
  let countedDays = 0;
  
  for (let i = 1; i < data.length; i++) {
    const previous = data[i-1];
    const current = data[i];
    
    if (previous > 0) {
      const dailyGrowth = ((current - previous) / previous) * 100;
      totalGrowthRate += dailyGrowth;
      countedDays++;
    }
  }
  
  const growthRate = countedDays > 0 ? totalGrowthRate / countedDays : 0.5;
  
  const forecast: number[] = [];
  for (let i = 0; i < steps; i++) {
    const dayFactor = 1 + (growthRate / 100) + (Math.random() * 0.02 - 0.01);
    const nextValue = i === 0 ? lastValue * dayFactor : forecast[i-1] * dayFactor;
    forecast.push(Math.round(nextValue));
  }
  
  return forecast;
};

export const randomForestForecast = (data: number[], steps: number = 30): number[] => {
  if (data.length < 10) {
    return simpleExponentialForecast(data, steps);
  }
  
  const lagSize = Math.min(5, Math.floor(data.length / 3));
  const { X, y } = extractFeatures(data, lagSize);
  
  if (X.length === 0 || y.length === 0) {
    return simpleExponentialForecast(data, steps);
  }
  
  const FIXED_SEED = 42;
  const numTrees = 5;
  const forest = buildRandomForest(X, y, numTrees, FIXED_SEED);
  
  const forecast: number[] = [];
  const currentData = [...data];
  
  for (let i = 0; i < steps; i++) {
    const lastValues = currentData.slice(-lagSize);
    if (lastValues.length < lagSize) {
      const remainingForecasts = simpleExponentialForecast(currentData, steps - i);
      forecast.push(...remainingForecasts);
      break;
    }
    
    const features = [];
    
    for (let lag = 0; lag < lagSize; lag++) {
      features.push(lastValues[lagSize - 1 - lag]);
    }
    
    const ma3 = (lastValues[lagSize-1] + lastValues[lagSize-2] + lastValues[lagSize-3]) / 3;
    features.push(ma3);
    
    const trend = lastValues[lagSize-1] - ma3;
    features.push(trend);
    
    const cyclical = Math.sin(2 * Math.PI * (currentData.length % 7) / 7);
    features.push(cyclical);
    
    const prediction = predictWithForest(forest, features);
    
    const noise = (Math.random() * 0.02 - 0.01) * Math.abs(prediction);
    const forecastValue = prediction + noise;
    
    forecast.push(Math.round(forecastValue));
    currentData.push(Math.round(forecastValue));
  }
  
  return forecast;
};

export const calculateAverageGrowthRate = (data: number[]): number => {
  if (data.length < 2) return 0;
  
  let totalGrowthRate = 0;
  let countedPoints = 0;
  
  for (let i = 1; i < data.length; i++) {
    const previous = data[i-1];
    const current = data[i];
    
    if (previous > 0) {
      const growthRate = ((current - previous) / previous) * 100;
      totalGrowthRate += growthRate;
      countedPoints++;
    }
  }
  
  return countedPoints > 0 ? totalGrowthRate / countedPoints : 0.5;
};

export const analyzePatientRetention = (clinicDailyTrends: DailyTrends) => {
  if (clinicDailyTrends.dates.length < 10) {
    return {
      retentionRate: 0,
      returnProbability: 0,
      averageVisitGap: 0,
      predictedChurn: 0,
      confidenceScore: 0
    };
  }
  
  const totalOldPatients = clinicDailyTrends.oldPatients.reduce((sum, count) => sum + count, 0);
  const totalNewPatients = clinicDailyTrends.newPatients.reduce((sum, count) => sum + count, 0);
  
  const simpleRetentionRate = totalOldPatients / (totalOldPatients + totalNewPatients) * 100;
  
  const combinedPatientData = [];
  for (let i = 0; i < clinicDailyTrends.dates.length; i++) {
    combinedPatientData.push({
      date: clinicDailyTrends.dates[i],
      oldPatients: clinicDailyTrends.oldPatients[i] || 0,
      newPatients: clinicDailyTrends.newPatients[i] || 0,
      ratio: clinicDailyTrends.oldPatients[i] / 
            (clinicDailyTrends.oldPatients[i] + clinicDailyTrends.newPatients[i] || 1)
    });
  }
  
  const ratioSeries = combinedPatientData.map(d => d.ratio);
  const lagSize = Math.min(5, Math.floor(ratioSeries.length / 3));
  const { X, y } = extractFeatures(ratioSeries, lagSize);
  
  let returnProbability = simpleRetentionRate;
  let predictedChurn = 0;
  let confidenceScore = 75;
  
  if (X.length > 0 && y.length > 0) {
    const FIXED_SEED = 42;
    const numTrees = 5;
    const forest = buildRandomForest(X, y, numTrees, FIXED_SEED);
    
    const lastFeatures = X[X.length - 1];
    const prediction = predictWithForest(forest, lastFeatures);
    
    returnProbability = prediction * 100;
    
    predictedChurn = 100 - returnProbability;
    
    const variance = y.reduce((sum, val) => sum + Math.pow(val - (y.reduce((a, b) => a + b, 0) / y.length), 2), 0) / y.length;
    const dataQuality = Math.min(100, ratioSeries.length * 5);
    confidenceScore = Math.min(95, 75 + (dataQuality / 100) * 20 - (variance * 50));
  }
  
  let avgVisitGap = 0;
  if (totalOldPatients > 0 && clinicDailyTrends.dates.length > 1) {
    const dateGaps = [];
    let lastPeakIdx = 0;
    
    for (let i = 1; i < clinicDailyTrends.oldPatients.length; i++) {
      if (clinicDailyTrends.oldPatients[i] > clinicDailyTrends.oldPatients[i-1] && 
          clinicDailyTrends.oldPatients[i] > (clinicDailyTrends.oldPatients[i+1] || 0)) {
        if (lastPeakIdx > 0) {
          const date1 = new Date(clinicDailyTrends.dates[lastPeakIdx]);
          const date2 = new Date(clinicDailyTrends.dates[i]);
          const diffTime = Math.abs(date2.getTime() - date1.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          dateGaps.push(diffDays);
        }
        lastPeakIdx = i;
      }
    }
    
    avgVisitGap = dateGaps.length > 0 ? 
      dateGaps.reduce((sum, gap) => sum + gap, 0) / dateGaps.length : 
      14; // Default to 2 weeks if we can't calculate
  } else {
    avgVisitGap = 14; // Default assumption: patients return every 2 weeks
  }
  
  return {
    retentionRate: Math.round(simpleRetentionRate),
    returnProbability: Math.round(returnProbability),
    averageVisitGap: Math.round(avgVisitGap),
    predictedChurn: Math.round(predictedChurn),
    confidenceScore: Math.round(confidenceScore)
  };
};

export const analyzeVisitFrequency = (clinicDailyTrends: DailyTrends) => {
  const defaultResult = {
    peakDays: [],
    slowestDays: [],
    idealCapacity: 0,
    visitFrequencyDistribution: [0, 0, 0, 0, 0, 0, 0], // 7 days of the week
    confidenceScore: 0
  };
  
  if (clinicDailyTrends.dates.length < 7) {
    return defaultResult;
  }
  
  const dayOfWeekPatients = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekOccurrences = [0, 0, 0, 0, 0, 0, 0];
  clinicDailyTrends.dates.forEach((dateStr, index) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    const totalPatients = (clinicDailyTrends.oldPatients[index] || 0) + 
                      (clinicDailyTrends.newPatients[index] || 0);
    
    dayOfWeekPatients[dayOfWeek] += totalPatients;
    dayOfWeekOccurrences[dayOfWeek]++;
  });
  
  const avgPatientsByDay = dayOfWeekPatients.map((total, idx) => 
    dayOfWeekOccurrences[idx] > 0 ? total / dayOfWeekOccurrences[idx] : 0
  );
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const dayAverages = avgPatientsByDay.map((avg, idx) => ({
    day: dayNames[idx],
    average: avg
  }));
  
  const sortedByPeak = [...dayAverages].sort((a, b) => b.average - a.average);
  const peakDays = sortedByPeak.slice(0, 2).map(d => d.day); // Top 2 days
  
  const sortedBySlowest = [...dayAverages].sort((a, b) => a.average - b.average);
  const slowestDays = sortedBySlowest.slice(0, 2).map(d => d.day); // Bottom 2 days
  
  const totalPatientsByDay = clinicDailyTrends.dates.map((_, idx) => 
    (clinicDailyTrends.oldPatients[idx] || 0) + (clinicDailyTrends.newPatients[idx] || 0)
  );
  
  const sortedCounts = [...totalPatientsByDay].sort((a, b) => a - b);
  const p90index = Math.floor(sortedCounts.length * 0.9);
  const idealCapacity = sortedCounts[p90index] || 0;
  const totalPatients = dayOfWeekPatients.reduce((sum, count) => sum + count, 0);
  const visitFrequencyDistribution = dayOfWeekPatients.map(count => 
    totalPatients > 0 ? (count / totalPatients) * 100 : 0
  );
  
  const dataPoints = clinicDailyTrends.dates.length;
  const weeksOfData = Math.floor(dataPoints / 7);
  let confidenceScore = Math.min(95, 50 + (weeksOfData * 10));
  
  const daysWithNoData = dayOfWeekOccurrences.filter(count => count === 0).length;
  confidenceScore -= daysWithNoData * 10;
  
  return {
    peakDays,
    slowestDays,
    idealCapacity: Math.round(idealCapacity),
    visitFrequencyDistribution: visitFrequencyDistribution.map(v => Math.round(v)),
    confidenceScore: Math.max(0, Math.round(confidenceScore))
  };
};

export const generatePatientGrowthForecast = (clinicDailyTrends: DailyTrends) => {
  const recentOldPatients = clinicDailyTrends.oldPatients.slice(-7);
  const recentNewPatients = clinicDailyTrends.newPatients.slice(-7);
  const recentData = [...recentOldPatients, ...recentNewPatients];
  
  const growthRate = calculateAverageGrowthRate(recentData);
  const totalOldPatients = clinicDailyTrends.oldPatients.reduce((sum, count) => sum + count, 0);
  const totalNewPatients = clinicDailyTrends.newPatients.reduce((sum, count) => sum + count, 0);
  const totalPatients = totalOldPatients + totalNewPatients;
  
  // Estimate monthly growth
  const estimatedMonthlyGrowth = Math.round(totalPatients * (growthRate / 100) * 30);
  const estimatedAnnualPatients = Math.round(totalPatients * Math.pow(1 + (growthRate / 100), 12));
  
  return {
    growthRate,
    estimatedMonthlyGrowth,
    estimatedAnnualPatients
  };
};
