export async function onRequestPost(context) {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { trackingNumber } = body;

    if (!trackingNumber) {
      return new Response(JSON.stringify({ error: 'Falta el número de tracking (trackingNumber)' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // SOAP Payload para Tracking_Pieza (sin CUIT y sin DNI para omitir autenticación)
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Tracking_Pieza xmlns="#Oca_e_Pak">
      <Pieza>${trackingNumber.trim()}</Pieza>
      <NroDocumentoCliente></NroDocumentoCliente>
      <CUIT></CUIT>
    </Tracking_Pieza>
  </soap:Body>
</soap:Envelope>`;

    // Fetch al Webservice SOAP de OCA
    const ocaResponse = await fetch('https://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"#Oca_e_Pak/Tracking_Pieza"'
      },
      body: soapEnvelope
    });

    if (!ocaResponse.ok) {
      return new Response(JSON.stringify({ error: `Error en el servicio de OCA: ${ocaResponse.statusText}` }), {
        status: ocaResponse.status,
        headers: corsHeaders
      });
    }

    const xmlText = await ocaResponse.text();

    // Devolvemos el XML al frontend para que lo parsee de forma nativa
    return new Response(JSON.stringify({ success: true, xml: xmlText }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: `Error del proxy: ${error.message}` }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Soporte para preflight requests de CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
