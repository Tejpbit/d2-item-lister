package main

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"fmt"
	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
	"github.com/nokka/d2s"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type TotalState struct {
	Characters  []d2s.Character `json:"characters"`
	SharedStash []d2s.Item      `json:"shared_stash"`
}

var (
	totalState      = TotalState{}
	sendToWebsocket = make(chan *TotalState)
	upgrader        = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func main() {
	fmt.Printf("Args: %s\n", os.Args)

	go hostFrontend()

	if len(os.Args) < 2 {
		fmt.Print()

		panic("Missing arg for save dir e.g. .\\d2-items-reader \"<...>\\Diablo II\\Saves\\1.13d>\"")
	}
	saveDir := os.Args[1]

	fmt.Printf("D2 save directory: %s\n", saveDir)

	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		fmt.Printf("%s does not exist", saveDir)
		return
	}

	saveDir, err := filepath.Abs(saveDir)
	sharedStashFile := filepath.Join(saveDir, "_LOD_SharedStashSave.sss")
	//sharedStashFile := fmt.Sprintf("%s\\_LOD_SharedStashSave.sss", saveDir)

	fmt.Printf("SharedStashFile is %s\n", sharedStashFile)

	if _, err := os.Stat(sharedStashFile); os.IsNotExist(err) {
		fmt.Printf("%s does not exist", saveDir)
		return
	}
	items, err := parseSharedStash(sharedStashFile)
	if err != nil {
		fmt.Printf("Couldn't generate json from d2 files. %v", err)
		return
	}
	characters, err := parseCharacters(saveDir)
	if err != nil {
		panic("couldn't parse characters")
	}

	var _totalState = TotalState{Characters: characters, SharedStash: items}
	totalState = _totalState

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		fmt.Println("ERROR", err)
	}
	defer watcher.Close()

	err = watcher.Add(sharedStashFile)
	if err != nil {
		panic("Couldn't watch sharedStashFile")
	}

	err = setupWatchers(saveDir, watcher)
	if err != nil {
		fmt.Printf("couldn't setup file watchers %v", err)
		panic(err)
	}

	done := make(chan bool)

	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				fmt.Printf("EVENT! %v - %#v\n", ok, event)
				if event.Op&fsnotify.Remove == fsnotify.Remove {
					fmt.Printf("Remove")
					time.Sleep(time.Second)

					if _, err := os.Stat(sharedStashFile); os.IsNotExist(err) {
						fmt.Printf("%s does not exist", saveDir)
						return
					}
					items, err = parseSharedStash(sharedStashFile)
					if err != nil {
						fmt.Printf("Error generating json from d2 files. %v", err)
						panic(err)
					}
					err := watcher.Add(event.Name) // Watcher dies when file is removed

					totalState.SharedStash = items

					if err != nil {
						fmt.Printf("Error, %v", err)
					} else {
						fmt.Printf("Watching sharedStashfile again")

					}
				} else if event.Op&fsnotify.Write == fsnotify.Write {
					characters, err = parseCharacters(saveDir)
					if err != nil {
						panic("couldn't parse characters")
					}
					totalState.Characters = characters
				}
				sendToWebsocket <- &totalState

				// watch for errors
			case err := <-watcher.Errors:
				fmt.Println("ERROR", err)
			}
		}
	}()

	<-done
}

func hostFrontend() {
	fs := http.FileServer(http.Dir("./web-build"))
	http.Handle("/", fs)
	http.HandleFunc("/ws", serveWs)

	log.Println("Listening on :3000...")
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func serveWs(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		if _, ok := err.(websocket.HandshakeError); !ok {
			log.Println(err)
		}
		return
	}
	defer ws.Close()

	//var lastMod time.Time
	//if n, err := strconv.ParseInt(r.FormValue("lastMod"), 16, 64); err == nil {
	//	lastMod = time.Unix(0, n)
	//}
	err = ws.WriteMessage(websocket.TextMessage, []byte("Hello"))
	if err != nil {
		panic(err)
	}

	err = ws.WriteJSON(totalState)
	if err != nil {
		panic(err)
	}

	for {
		state := <-sendToWebsocket
		err = ws.WriteJSON(*state)
		if err != nil {
			log.Println("couldn't write json to ws")
			log.Println(err)
			break
		}
		log.Println("Sent new state over websocket")
	}
}

func parseCharacters(saveDir string) ([]d2s.Character, error) {
	var characters []d2s.Character
	err := filepath.Walk(saveDir, func(path string, info os.FileInfo, err error) error {
		if strings.HasSuffix(path, "d2s") {
			char, err := parseCharacter(path)
			if err != nil {
				return err
			}
			characters = append(characters, *char)
		}
		return nil
	})
	return characters, err
}

func setupWatchers(saveDir string, watcher *fsnotify.Watcher) error {
	return filepath.Walk(saveDir, func(path string, info os.FileInfo, err error) error {
		if strings.HasSuffix(path, "d2s") || strings.HasSuffix(path, "sss") {
			err := watcher.Add(path)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func parseCharacter(path string) (*d2s.Character, error) {
	file, err := os.Open(path)
	if err != nil {
		log.Fatal("Error while opening .d2s file", err)
	}

	defer file.Close()

	char, err := d2s.Parse(file)
	if err != nil {
		return nil, err
	}

	return char, nil
}

// https://d2mods.info/forum/viewtopic.php?t=31359
// https://d2mods.info/forum/viewtopic.php?p=71793#71793
func parseSharedStash(path string) ([]d2s.Item, error) {
	file, err := os.Open(path)
	if err != nil {
		fmt.Printf("Error while opening .d2s file")
		return nil, err
	}

	defer file.Close()

	//char, err := d2s.Parse(file)
	//if err != nil {
	//	log.Fatal(err)
	//}

	bfr := bufio.NewReader(file)
	err = readSharedStashHeader(bfr)
	if err != nil {
		return nil, err
	}
	version, err := readFileVersion(bfr)
	if err != nil {
		return nil, err
	}
	fmt.Printf("File version: %s\n", version)
	readSharedGoldAmount(bfr)
	stashCount, err := readNumberOfStashes(bfr)
	if err != nil {
		return nil, err
	}
	fmt.Printf("Stash pages: %d\n", stashCount)

	var accumulatedItems []d2s.Item
	var i uint16 = 0
	for ; i < stashCount; i++ {
		items, err := readStash(bfr)
		if err != nil {
			return nil, err
		}
		accumulatedItems = append(accumulatedItems, items...)
	}

	return accumulatedItems, nil
}

func readStash(bfr *bufio.Reader) ([]d2s.Item, error) {
	err := readST(bfr)
	if err != nil {
		return nil, err
	}
	// what are these bytes? meh probably not that important
	bfr.ReadByte()
	bfr.ReadByte()
	bfr.ReadByte()
	bfr.ReadByte()
	bfr.ReadByte()
	char := d2s.Character{}
	err = d2s.ParseItems(bfr, &char)
	if err != nil {
		return nil, err
	}
	return char.Items, nil
}

func readST(bfr *bufio.Reader) error {
	p := make([]byte, 2)
	n, err := io.ReadFull(bfr, p)
	if err != nil {
		return err
	}
	if n != 2 {
		return fmt.Errorf("could read 2 bytes for file version, got %d bytes", n)

	}
	return nil
}

func readSharedStashHeader(bfr *bufio.Reader) error {
	b1, err := bfr.ReadByte()
	if err != nil {
		panic(err)
	}
	if int(b1) != 83 {
		return fmt.Errorf("could read shared stash header, should be 83, was %d", b1)
	}

	b2, err := bfr.ReadByte()
	if err != nil {
		panic(err)
	}
	if int(b2) != 83 {
		return fmt.Errorf("could read shared stash header, should be 83, was %d", b2)
	}

	b3, err := bfr.ReadByte()
	if err != nil {
		panic(err)
	}
	if int(b3) != 83 {
		return fmt.Errorf("could read shared stash header, should be 83, was %d", b3)
	}

	b4, err := bfr.ReadByte()
	if err != nil {
		panic(err)
	}
	if int(b4) != 0 {
		return fmt.Errorf("could read shared stash header, should be 0, was %d", b4)
	}
	return nil
}

func readFileVersion(bfr *bufio.Reader) (string, error) {
	p := make([]byte, 2)
	n, err := io.ReadFull(bfr, p)
	if err != nil {
		panic(err)
	}
	if n != 2 {
		return "", fmt.Errorf("could read 2 bytes for file version, got %d bytes", n)
	}

	return string(p), nil
}

func readSharedGoldAmount(bfr *bufio.Reader) (int, error) {
	bfr.ReadByte()
	bfr.ReadByte()
	bfr.ReadByte()
	bfr.ReadByte()
	return 0, nil
}

type StashNum struct {
	Count uint16
}

func readNumberOfStashes(bfr *bufio.Reader) (uint16, error) {
	p := make([]byte, 4)
	n, err := io.ReadFull(bfr, p)
	if err != nil {
		panic(err)
	}
	if n != 4 {
		return 0, fmt.Errorf("could read 4 bytes for number of stashes, got %d bytes", n)
	}

	a := StashNum{}
	//fmt.Printf("P: %v", p)
	err = binary.Read(bytes.NewBuffer(p), binary.LittleEndian, &a)
	if err != nil {
		return 0, err
	}

	//fmt.Printf("A: %v\n", a)

	//var mySlice = p
	//data := binary.LittleEndian.Uint32(mySlice)
	//fmt.Printf("??? %d", data)
	return a.Count, nil
}

func prettyPrintBytes(bfr *bufio.Reader) {
	for i := 0; i < 10; i++ {
		b, e := bfr.ReadByte()
		if e != nil {
			fmt.Printf("Error: %v", e)
			return
		}
		fmt.Printf("%s %d\n", string(b), b)
	}
}
