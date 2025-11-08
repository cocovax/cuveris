import { useEffect } from 'react'
import { addTelemetryListener, ensureMqttBridge } from '../services/mqttClient'
import { useTankStore } from '../store/tankStore'
import { useMqttStore } from '../store/mqttStore'

export function useMqttBridge() {
  const applyTelemetry = useTankStore((state) => state.applyTelemetry)

  useEffect(() => {
    ensureMqttBridge()
    const unsubscribe = addTelemetryListener(applyTelemetry)

    return () => {
      unsubscribe()
      useMqttStore.setState({ status: 'disconnected' })
    }
  }, [applyTelemetry])
}

