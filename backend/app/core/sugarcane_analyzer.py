from typing import List, Dict, Any

THRESHOLDS = {
    "temperature": {"ideal_min": 21, "ideal_max": 34, "critical_low": 15, "critical_high": 38},
    "humidity": {"ideal_min": 60, "ideal_max": 85, "fungal_risk": 90},
    "wind_speed": {"lodging_risk": 60},
}

class SugarcaneAnalyzer:
    
    @staticmethod
    def analyze(weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa dados climáticos no contexto de cultivo de cana"""
        factors = []
        alerts = []
        
        # Análise de temperatura
        temp = weather_data.get("temperature", 0)
        if temp < THRESHOLDS["temperature"]["critical_low"]:
            factors.append({
                "parameter": "temperature",
                "status": "critical",
                "message": f"Temperatura muito baixa ({temp}°C)",
                "recommendation": "Risco de paralisação do crescimento - proteger brotações"
            })
        elif temp > THRESHOLDS["temperature"]["critical_high"]:
            factors.append({
                "parameter": "temperature",
                "status": "critical",
                "message": f"Temperatura muito alta ({temp}°C)",
                "recommendation": "Estresse térmico - aumentar frequência de irrigação"
            })
        elif THRESHOLDS["temperature"]["ideal_min"] <= temp <= THRESHOLDS["temperature"]["ideal_max"]:
            factors.append({
                "parameter": "temperature",
                "status": "ideal",
                "message": f"Temperatura ideal para crescimento ({temp}°C)",
                "recommendation": "Condições ótimas para fotossíntese e desenvolvimento"
            })
        else:
            factors.append({
                "parameter": "temperature",
                "status": "attention",
                "message": f"Temperatura fora da faixa ideal ({temp}°C)",
                "recommendation": "Monitorar crescimento das plantas"
            })
        
        # Análise de umidade
        humidity = weather_data.get("humidity", 0)
        if humidity > THRESHOLDS["humidity"]["fungal_risk"]:
            factors.append({
                "parameter": "humidity",
                "status": "warning",
                "message": f"Umidade muito alta ({humidity}%)",
                "recommendation": "Risco elevado de ferrugem e doenças fúngicas"
            })
            alerts.append({
                "severity": "warning",
                "message": "Umidade crítica - monitorar aparecimento de doenças"
            })
        elif THRESHOLDS["humidity"]["ideal_min"] <= humidity <= THRESHOLDS["humidity"]["ideal_max"]:
            factors.append({
                "parameter": "humidity",
                "status": "ideal",
                "message": f"Umidade adequada ({humidity}%)",
                "recommendation": "Condições favoráveis"
            })
        else:
            factors.append({
                "parameter": "humidity",
                "status": "attention",
                "message": f"Umidade fora da faixa ideal ({humidity}%)",
                "recommendation": "Monitorar necessidade de irrigação"
            })
        
        # Análise de vento
        wind = weather_data.get("wind_speed", 0)
        if wind > THRESHOLDS["wind_speed"]["lodging_risk"]:
            factors.append({
                "parameter": "wind",
                "status": "critical",
                "message": f"Vento forte ({wind} km/h)",
                "recommendation": "Risco de acamamento - vistoriar áreas expostas"
            })
            alerts.append({
                "severity": "critical",
                "message": "Alerta de vento forte - risco de danos às plantas"
            })
        else:
            factors.append({
                "parameter": "wind",
                "status": "good",
                "message": f"Vento moderado ({wind} km/h)",
                "recommendation": "Sem riscos relacionados ao vento"
            })
        
        # UV Index
        uv = weather_data.get("uv_index")
        if uv and uv > 6:
            alerts.append({
                "severity": "info",
                "message": f"UV index alto ({uv}) - favorável para fotossíntese"
            })
        
        # Status geral
        critical_count = sum(1 for f in factors if f["status"] == "critical")
        warning_count = sum(1 for f in factors if f["status"] == "warning")
        
        if critical_count > 0:
            overall_status = "unfavorable"
            recommendation = "Atenção: condições críticas detectadas"
        elif warning_count > 0:
            overall_status = "attention"
            recommendation = "Monitoramento recomendado"
        else:
            overall_status = "favorable"
            recommendation = "Condições favoráveis para crescimento"
        
        return {
            "overall_status": overall_status,
            "growth_stage_recommendation": recommendation,
            "factors": factors,
            "alerts": alerts
        }
