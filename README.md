# Home & Config Notes

## OSX

### HomeBrew

#### $PATH

Move `/usr/local/bin` from the bottom to the top of `/etc/paths` so that homebrew apps take priority.

### Python

#### Install

Install using brew, see note about `/usr/local/bin` in the HomeBrew -> $PATH section above.

    $ brew install python
    $ pip install --upgrade pip
    $ pip install --upgrade setuptools

[source](https://github.com/mxcl/homebrew/wiki/Homebrew-and-Python)

### Ruby

#### Install RVM with stable Ruby

    $ \curl -L https://get.rvm.io | bash -s stable --ruby
   
*There is a backslash before curl. This prevents misbehaving if you have aliased it with configuration in your ~/.curlrc file.*

#### For a progress bar when downloading RVM / Rubies:__

    $ echo progress-bar >> ~/.curlrc

[source](https://rvm.io/rvm/install)

### [Mac]Vim

Install using brew

    $ brew install macvim --env-std --override-system-vim

Or to reinstall

    $ brew reinstall macvim --env-std --override-system-vim
    
_Useful commands_

    :w !sudo tee %               "Save a file you edited without needed permissions
    :w !sudo tee > /dev/null %   "Same as above but hide stdout


