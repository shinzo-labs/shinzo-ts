import { v4 as uuidv4 } from 'uuid'
import * as os from 'os'

export const generateUuid = () => {
  return uuidv4()
}

export const getRuntimeInfo = () => {
    const port = process.env.PORT

    const networkInterfaces = os.networkInterfaces()
    let address = 'localhost'

    // Find the first non-internal IPv4 address
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName]
      if (interfaces) {
        for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
            address = iface.address
            break
          }
        }
        if (address !== 'localhost') break
      }
    }

    return { address, port }
  }
  