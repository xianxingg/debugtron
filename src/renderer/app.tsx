import React, { useEffect, useState } from 'react'
import { ipcRenderer, remote } from 'electron'
import { useDropzone } from 'react-dropzone'
import { Tabs, Tab, Divider, Pre } from '@blueprintjs/core'
import path from 'path'
import './app.css'
import { useSelector, useDispatch } from 'react-redux'
import { State } from '../reducer'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('')
  const { appInfo, instanceInfo } = useSelector<State, State>(s => s)
  const dispath = useDispatch()
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    noClick: true,
    onDrop(files) {
      // Find shortest path
      const [file] = files.sort((a, b) => a.path.length - b.path.length)
      if (!file) return

      ipcRenderer.send('startDebugging', {
        path: path.dirname(path.dirname(file.path)),
      })
    },
  })

  useEffect(() => {
    const instanceIds = Object.keys(instanceInfo)
    if (!activeTab && instanceIds.length) {
      setActiveTab(instanceIds[0])
    }
  }, [activeTab, instanceInfo])

  const instanceEntries = Object.entries(instanceInfo)

  return (
    <div
      style={{
        height: '100vh',
        padding: '1px 8px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3>Installed Electron-based App (Click to debug)</h3>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexGrow: 1, overflowX: 'auto' }}>
          {Object.entries(appInfo).map(([id, app]) => (
            <a
              key={id}
              href="#"
              onClick={e => {
                e.preventDefault()
                ipcRenderer.send('startDebugging', { id: app.id })
              }}
              style={{ padding: 4, textAlign: 'center', width: 100 }}
              className="app-icon"
            >
              <img
                src={app.icon || require('./images/electron.png')}
                style={{ width: 64, height: 64 }}
              />
              <div>{app.name}</div>
            </a>
          ))}
        </div>
        <Divider />
        <div
          {...getRootProps({
            style: {
              padding: 20,
              borderWidth: 2,
              borderRadius: 2,
              borderColor: '#eeeeee',
              borderStyle: 'dashed',
              backgroundColor: '#fafafa',
              color: '#aaa',
              outline: 'none',
              transition: 'border 0.24s ease-in-out',
              display: 'flex',
              marginTop: 10,
              marginBottom: 10,
            },
          })}
        >
          <input {...getInputProps()} />
          <p style={{ alignSelf: 'center' }}>
            App not found? Drag your app here
          </p>
        </div>
      </div>

      <Divider />

      <div style={{ overflowY: 'auto' }}>
        {instanceEntries.length ? (
          <Tabs
            selectedTabId={activeTab}
            onChange={key => {
              setActiveTab(key as string)
            }}
          >
            {instanceEntries.map(([id, instance]) => (
              <Tab
                id={id}
                key={id}
                title={appInfo[instance.appId].name}
                panel={
                  <div style={{ display: 'flex', marginTop: -20 }}>
                    <div style={{ flexBasis: 200, flexShrink: 0 }}>
                      <h3>Sessions (Click to open)</h3>
                      {instance.pages.map(page => (
                        <div key={page.id}>
                          <a
                            href="#"
                            onClick={e => {
                              e.preventDefault()
                              const win = new remote.BrowserWindow()
                              win.loadURL(
                                page.devtoolsFrontendUrl.replace(
                                  /^\/devtools/,
                                  'chrome-devtools://devtools/bundled',
                                ),
                              )
                            }}
                          >
                            {page.title}
                          </a>
                        </div>
                      ))}
                    </div>
                    <Divider />
                    <Pre
                      style={{
                        flexGrow: 1,
                        overflow: 'auto',
                        userSelect: 'text',
                      }}
                    >
                      {instance.log}
                    </Pre>
                  </div>
                }
              />
            ))}
          </Tabs>
        ) : (
          <div
            style={{
              fontSize: 24,
              color: '#bbb',
              width: '100%',
              height: '100%',
              paddingTop: 100,
              textAlign: 'center',
            }}
          >
            Click App icon to debug
          </div>
        )}
      </div>
    </div>
  )
}
