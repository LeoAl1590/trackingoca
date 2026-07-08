document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const trackingForm = document.getElementById('tracking-form');
  const trackingInput = document.getElementById('tracking-input');
  const searchBtn = document.getElementById('search-btn');
  const themeToggle = document.getElementById('theme-toggle');
  
  // Section States
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const resultsState = document.getElementById('results-state');
  
  // Result Info Elements
  const currentStatusTitle = document.getElementById('current-status-title');
  const currentStatusDesc = document.getElementById('current-status-desc');
  const statusBadge = document.getElementById('status-badge');
  const metaTrackingNumber = document.getElementById('meta-tracking-number');
  const metaLastUpdate = document.getElementById('meta-last-update');
  const metaSucursalName = document.getElementById('meta-sucursal-name');
  const metaSucursalItem = document.getElementById('meta-sucursal-item');
  const timelineFlow = document.getElementById('timeline-flow');
  
  // Demo Actions
  const useDemoBtn = document.getElementById('use-demo-btn');
  const demoMockBtn = document.getElementById('demo-mock-btn');

  // Mapeo de Estados de OCA para UI (Tech Editorial)
  const STATE_MAPPING = {
    // Entregado
    'entregado': { title: 'Entregado', desc: 'El envío fue entregado exitosamente.', class: 'entregado', timelineClass: 'delivered' },
    'entregada': { title: 'Entregado', desc: 'El envío fue entregado exitosamente.', class: 'entregado', timelineClass: 'delivered' },
    
    // Problemas / Alertas
    'no responde': { title: 'No responde', desc: 'Se visitó el domicilio pero no hubo respuesta.', class: 'alerta', timelineClass: 'failed' },
    'visita': { title: 'Visita Realizada', desc: 'No se pudo concretar la entrega en esta visita.', class: 'alerta', timelineClass: 'failed' },
    'imposible de entregar': { title: 'Visita Fallida', desc: 'Imposible realizar la entrega del paquete.', class: 'alerta', timelineClass: 'failed' },
    'rechazado': { title: 'Envío Rechazado', desc: 'El destinatario rechazó la recepción del paquete.', class: 'alerta', timelineClass: 'failed' },
    
    // Listo para retirar (Sucursal)
    'arribado a sucursal': { title: 'Listo en Sucursal', desc: 'El envío se encuentra en la sucursal listo para ser retirado.', class: 'preparando', timelineClass: 'active' },
    'recepcionada en sucursal': { title: 'Recibido en Sucursal', desc: 'El paquete ingresó a la sucursal de destino.', class: 'preparando', timelineClass: 'active' },
    'en sucursal': { title: 'En Sucursal', desc: 'Listo para retiro en mostrador.', class: 'preparando', timelineClass: 'active' },
    
    // En camino / Tránsito
    'en camino': { title: 'En Camino', desc: 'El paquete se encuentra en viaje hacia la próxima estación.', class: '', timelineClass: 'active' },
    'en viaje': { title: 'En Viaje', desc: 'El paquete está en tránsito hacia la sucursal de destino.', class: '', timelineClass: 'active' },
    'en calle': { title: 'En Distribución', desc: 'El cartero se encuentra en viaje para realizar la entrega hoy.', class: '', timelineClass: 'active' },
    'en distribucion': { title: 'En Distribución', desc: 'El envío se encuentra en el recorrido final de entrega.', class: '', timelineClass: 'active' },
    
    // Proceso / Preparación
    'en proceso': { title: 'En Proceso', desc: 'El envío se está clasificando en la planta operativa.', class: 'preparando', timelineClass: 'active' },
    'procesado': { title: 'Procesado', desc: 'El envío fue clasificado y procesado en la planta operativa.', class: 'preparando', timelineClass: 'active' },
    'retirado': { title: 'Retirado', desc: 'El envío fue retirado del origen.', class: 'preparando', timelineClass: 'active' },
    'recibido': { title: 'Recibido', desc: 'OCA ya posee el paquete en físico en su red de distribución.', class: 'preparando', timelineClass: 'active' },
    'al aguardo del físico': { title: 'Esperando Paquete', desc: 'Envío registrado digitalmente, aguardando recepción física de la mercadería.', class: 'preparando', timelineClass: 'active' },
    'lógico recibido': { title: 'Envío Registrado', desc: 'Los datos del envío fueron procesados digitalmente por el remitente.', class: 'preparando', timelineClass: 'active' }
  };

  // Obtener info del estado basado en texto
  function getStatusInfo(estadoTxt, motivoTxt) {
    const estadoLower = (estadoTxt || '').toLowerCase().trim();
    const motivoLower = (motivoTxt || '').toLowerCase().trim();
    
    // Buscar coincidencia parcial
    for (const key in STATE_MAPPING) {
      if (estadoLower.includes(key) || motivoLower.includes(key)) {
        return STATE_MAPPING[key];
      }
    }
    
    // Default en caso de no matchear nada
    return {
      title: estadoTxt || 'En proceso',
      desc: motivoTxt && motivoTxt !== 'Sin Motivo' ? motivoTxt : 'El envío está siendo gestionado por OCA.',
      class: '',
      timelineClass: 'active'
    };
  }

  // --- Theme Toggle (Dark / Light Mode) ---
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  // --- Acciones de Demo ---
  if (useDemoBtn) {
    useDemoBtn.addEventListener('click', () => {
      trackingInput.value = 'G0000251013972';
      trackingForm.dispatchEvent(new Event('submit'));
    });
  }

  if (demoMockBtn) {
    demoMockBtn.addEventListener('click', () => {
      showLoading();
      setTimeout(() => {
        renderMockData();
      }, 1200);
    });
  }

  // --- Manejo del Formulario ---
  trackingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const trackingNumber = trackingInput.value.trim();
    
    if (!trackingNumber) return;

    showLoading();

    try {
      // Llamada a la Cloudflare Pages Function local/remota
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.xml) {
        showError('Error de servidor', data.error || 'No se pudo obtener información del paquete.');
        return;
      }

      parseAndRenderXML(data.xml, trackingNumber);

    } catch (err) {
      console.error(err);
      // Fallback a simulación si estamos en local sin backend wrangler levantado
      if (err.message.includes('Failed to fetch') || err.message.includes('HTTP Error: 404')) {
        console.log("Servidor local no detectado, usando fallback de simulación...");
        renderMockData(trackingNumber);
      } else {
        showError('Error de Conexión', 'Hubo un problema de red. Verificá tu conexión o intentá más tarde.');
      }
    }
  });

  // Mostrar Loading
  function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    resultsState.classList.add('hidden');
  }

  // Mostrar Error
  function showError(title, message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    resultsState.classList.add('hidden');
    
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-message').textContent = message;
  }

  // Parsear y Renderizar XML de OCA
  function parseAndRenderXML(xmlString, trackingNumber) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const tables = xmlDoc.querySelectorAll('Table');

      if (!tables || tables.length === 0) {
        showError('Envío no encontrado', `El código ${trackingNumber} no registra movimientos en OCA. Verificá si está bien escrito.`);
        return;
      }

      // Mapear elementos del XML
      const rawEvents = Array.from(tables).map((table, idx) => {
        // Manejar el tag con error de escritura del XML de OCA 'Desdcripcion_Estado'
        const rawEstado = table.querySelector('Desdcripcion_Estado')?.textContent || 
                          table.querySelector('Descripcion_Estado')?.textContent || 
                          table.querySelector('estadoWebOCA')?.textContent || '';
        
        // Limpiar el estado quitando el sufijo redundante del local/sucursal que devuelve OCA
        const cleanEstado = rawEstado.trim()
          .replace(/\s*-\s*suc:.*$/i, '')
          .replace(/\s*-\s*sucursal.*$/i, '')
          .trim();
        
        const motivo = table.querySelector('Descripcion_Motivo')?.textContent || 
                       table.querySelector('motivoDescripcion')?.textContent || 'Sin Motivo';
        
        const nroEnvio = table.querySelector('NumeroEnvio')?.textContent || trackingNumber;
        const suc = table.querySelector('SUC')?.textContent || '';
        const fecha = table.querySelector('fecha')?.textContent || 
                      table.querySelector('fechaEstadoSolicitud')?.textContent || '';

        return {
          id: idx + 1,
          estado: cleanEstado,
          motivo: motivo.trim(),
          nroEnvio: nroEnvio.trim(),
          suc: suc.trim(),
          fecha: fecha.trim()
        };
      });

      // Ordenar cronológicamente (más nuevo primero)
      const sortedEvents = rawEvents.reverse();

      renderTimeline(sortedEvents, trackingNumber);

    } catch (parseError) {
      console.error('XML Parse Error:', parseError);
      showError('Error de Datos', 'La respuesta del correo no pudo ser procesada correctamente.');
    }
  }

  // Renderizar la información en la UI
  function renderTimeline(events, trackingNumber) {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultsState.classList.remove('hidden');

    const latestEvent = events[0];
    const statusInfo = getStatusInfo(latestEvent.estado, latestEvent.motivo);

    // Actualizar Badge de Estado Principal
    if (statusBadge) {
      statusBadge.className = 'status-pill-badge ' + (statusInfo.class || 'transito');
      statusBadge.textContent = statusInfo.title.toUpperCase();
    }
    
    currentStatusTitle.textContent = statusInfo.title;
    currentStatusDesc.textContent = latestEvent.estado;

    metaTrackingNumber.textContent = trackingNumber;
    metaLastUpdate.textContent = latestEvent.fecha || 'Reciente';
    
    if (latestEvent.suc) {
      metaSucursalItem.classList.remove('hidden');
      metaSucursalName.textContent = latestEvent.suc;
    } else {
      metaSucursalItem.classList.add('hidden');
    }

    // Inyectar el Timeline como Logs Técnicos
    timelineFlow.innerHTML = '';
    
    events.forEach((ev, index) => {
      const evStatus = getStatusInfo(ev.estado, ev.motivo);
      const isActive = index === 0;
      let markerClass = evStatus.timelineClass === 'active' ? '' : evStatus.timelineClass; // 'delivered', 'failed' o ''
      
      const rowEl = document.createElement('div');
      rowEl.className = `log-row ${isActive ? 'active' : ''} ${markerClass}`;
      rowEl.style.animationDelay = `${index * 0.05}s`;

      // Limpiar texto de sucursal para que sea más corto
      const cleanSuc = (ev.suc || '')
        .replace(/^suc:\s*/i, '')
        .replace(/^sucursal oca:\s*/i, '')
        .trim();

      rowEl.innerHTML = `
        <div class="log-date">${ev.fecha}</div>
        <div class="log-timeline-node">
          <div class="log-status-dot"></div>
        </div>
        <div class="log-details">
          <div class="log-status-header">
            <span class="log-event-text">${ev.estado}</span>
            ${cleanSuc ? `<span class="log-sucursal-badge">${cleanSuc}</span>` : ''}
          </div>
          ${ev.motivo && ev.motivo !== 'Sin Motivo' ? `<div class="log-comment">${ev.motivo}</div>` : ''}
        </div>
      `;
      
      timelineFlow.appendChild(rowEl);
    });
  }

  // --- Render de Datos de Simulación / Mock ---
  function renderMockData(trackingNumber = 'G0000251013972') {
    const mockEvents = [
      {
        fecha: '2026-07-08 11:10:00',
        suc: 'RO (ROSARIO)',
        estado: 'Entregado',
        motivo: 'Recibido por titular en mano con firma'
      },
      {
        fecha: '2026-07-07 16:45:00',
        suc: 'RO (ROSARIO)',
        estado: 'En viaje a Sucursal de Destino',
        motivo: 'Despachado en camión troncal'
      },
      {
        fecha: '2026-07-06 14:30:00',
        suc: 'PVS (PLANTA VELEZ SARSFIELD)',
        estado: 'En Proceso en OCA',
        motivo: 'Clasificación automática completada'
      },
      {
        fecha: '2026-07-05 09:15:00',
        suc: 'CABA',
        estado: 'Lógico Recibido',
        motivo: 'Al Aguardo del Físico'
      }
    ];

    renderTimeline(mockEvents, trackingNumber);
  }
});
