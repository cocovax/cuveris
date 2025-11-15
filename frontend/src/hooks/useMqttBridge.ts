import { useEffect, useRef } from 'react'
import { mqttGateway } from '../services/mqttGateway'
import { useTankStore } from '../store/tankStore'
import { useAuthStore } from '../store/authStore'

export function useMqttBridge() {
  const applyTelemetryRef = useRef(useTankStore.getState().applyTelemetry)
  const authStatus = useAuthStore((state) => state.status)
  const token = useAuthStore((state) => state.token)

  // Mettre à jour la référence à chaque changement
  useEffect(() => {
    applyTelemetryRef.current = useTankStore.getState().applyTelemetry
  })

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      mqttGateway.stop()
      return undefined
    }
    console.log('[useMqttBridge] Initialisation du bridge MQTT')
    mqttGateway.restart()
    const unsubscribe = mqttGateway.onTelemetry((payload) => {
      console.log('[useMqttBridge] Télémétrie reçue, appel applyTelemetry pour cuve', payload.ix)
      applyTelemetryRef.current(payload)
    })
    return () => {
      console.log('[useMqttBridge] Nettoyage du bridge MQTT')
      unsubscribe()
    }
  }, [authStatus, token])
}

