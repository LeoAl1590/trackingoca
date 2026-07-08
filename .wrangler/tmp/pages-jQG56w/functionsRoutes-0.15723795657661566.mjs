import { onRequestOptions as __api_track_js_onRequestOptions } from "E:\\Cosas\\TrackingOCA\\functions\\api\\track.js"
import { onRequestPost as __api_track_js_onRequestPost } from "E:\\Cosas\\TrackingOCA\\functions\\api\\track.js"

export const routes = [
    {
      routePath: "/api/track",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_track_js_onRequestOptions],
    },
  {
      routePath: "/api/track",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_track_js_onRequestPost],
    },
  ]