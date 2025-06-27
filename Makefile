# Install dependencies: npm install --save-dev esbuild typescript

SRC		:=	src/game.ts

BUNDLE	:=	./$(OUT_DIR)/bundle.js
OUT_DIR	:=	dist

.PHONY: all build clean

all: build

build: $(BUNDLE)

$(OUT_DIR):
	mkdir -p $(OUT_DIR)

$(BUNDLE): $(OUT_DIR) $(SRC)
	npx esbuild $(SRC) --bundle --outfile=$(BUNDLE) --platform=browser

clean:
	rm -rf $(OUT_DIR)

re: clean all

