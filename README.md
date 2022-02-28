# My OSX / Linux configs

Storage for configs I want to keep synched across computers.

## Setup

```sh
# install homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git iterm2 fnm fzf spotify gnupg pinetry-mac wget
brew install --cask keybase

# Install fzf
$(brew --prefix)/opt/fzf/install

# [manual] Install fira code ttf fonts from: https://www.nerdfonts.com/font-downloads
# [manual] Add ssh keys to ~/.ssh
# [manual] Configure iterm2 to look in ~/configs/iTerm2


# Initial configs
mkdir -p ~/src/llwt
cd ~/src/llwt
git clone git@github.com:llwt/configs.git
ln -s ~/src/llwt/configs/dotfiles/.gitconfig ~/.gitconfig
ln -fs ~/src/llwt/configs/dotfiles/.zshrc ~/.zshrc
ln -s ~/src/llwt/configs/bin ~/.bin

# ZSH
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone --recursive git://github.com/joel-porquet/zsh-dircolors-solarized $ZSH_CUSTOM/plugins/zsh-dircolors-solarized
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
curl -o $ZSH_CUSTOM/themes/bullet-train.zsh-theme https://raw.githubusercontent.com/caiogondim/bullet-train-oh-my-zsh-theme/master/bullet-train.zsh-theme

# GPG
keybase pgp export -q <key-id> | gpg --import
keybase pgp export -q <key-id> --secret | gpg --allow-secret-key --import
gpg --edit-key 7BED1A46C186A274
# trust
# 5 // trust ultimately
# y
```

### Mac Specifics

Enable key repeat:

```sh
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false
```
